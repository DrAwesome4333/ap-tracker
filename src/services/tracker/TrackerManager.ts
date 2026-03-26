import { DataStore } from "../dataStores";
import GenericLocationTracker from "./generic/GenericLocationTracker";
import GenericItemTracker from "./generic/GenericItemTracker";
import { ItemTracker, ItemTrackerManifest } from "./itemTrackers/itemTrackers";
import CustomLocationTracker from "./locationTrackers/CustomLocationTracker";
import {
    LocationTracker,
    LocationTrackerManifest,
} from "./locationTrackers/locationTrackers";
import { ResourceType } from "./resourceEnums";
import { ResourceManifest, ResourceRepository } from "./resource";
import { GamePackageWrapper } from "../gamepackage/GamePackageWrapper";
import NotificationManager, {
    MessageType,
} from "../notifications/notifications";

const modified = Symbol("modified");
type TrackerDirectory = {
    games: string[];
    trackers: {
        [type: string]: ResourceManifest[];
    };
};

type TrackerDirectoryPrivate = {
    games: string[];
    trackers: {
        [type: string]: ResourceManifest[];
    };
    [modified]: number;
};

type TrackerResourceId = {
    uuid: string;
    version: string;
    type: ResourceType;
};

type TrackerResourceIds = {
    [type: string]: TrackerResourceId;
};

type TrackerChoiceOptions = {
    [game: string]: TrackerResourceIds;
};

// Types to help make maps more readable
type GameId = string | null;
type RepositoryId = string;
type TrackerKey = string;

const getTrackerKey = (tracker: TrackerResourceId): TrackerKey => {
    return tracker
        ? `${tracker.uuid}-${tracker.version}-${tracker.type}`
        : null;
};

class TrackerManager {
    /** Maps repositories ids to the actual repository, as well as a clean up call */
    #repositories: Map<
        RepositoryId,
        { repo: ResourceRepository; listenerCleanUp: () => void }
    > = new Map();
    /** Maps tracker keys to their source repository */
    #trackerRepositoryMap: Map<TrackerKey, RepositoryId> = new Map();
    /** Maps tracker keys to their full manifest */
    #allTrackers: Map<string, LocationTrackerManifest | ItemTrackerManifest> =
        new Map();
    /** Maps games, to listeners to updates for said game. Null triggers for all games here */
    #gameTrackerCallbacks: Map<GameId, Set<() => void>> = new Map();
    /** Listeners for directory changes */
    #directoryCallbacks: Set<() => void> = new Set();
    /** When the listener directory was last modified, used to compare to cache */
    #directoryModified = Date.now();
    /** Cached version of the directory to keep React happy when nothing has changed */
    #cachedDirectory: TrackerDirectoryPrivate = {
        games: [],
        trackers: {
            [ResourceType.locationTracker]: [],
            [ResourceType.itemTracker]: [],
        },
        [modified]: 0,
    };

    #defaults: TrackerResourceIds = {
        [ResourceType.locationTracker]: {
            uuid: GenericLocationTracker.uuid,
            version: "0.0.0",
            type: ResourceType.locationTracker,
        },
        [ResourceType.itemTracker]: {
            uuid: GenericItemTracker.uuid,
            version: "0.0.0",
            type: ResourceType.itemTracker,
        },
    };

    #trackerChoiceOptions: TrackerChoiceOptions = {};
    #optionsStore: DataStore;

    constructor(optionStore: DataStore) {
        this.#optionsStore = optionStore;
        this.#trackerChoiceOptions = (this.#optionsStore.read() ??
            {}) as TrackerChoiceOptions;
        const subscribe = this.#optionsStore.getUpdateSubscriber();
        subscribe(() => {
            const newOptions =
                this.#optionsStore.read() as TrackerChoiceOptions;

            const changedGames: Set<GameId> = new Set();
            Object.entries(newOptions).forEach(([game, trackers]) => {
                Object.entries(trackers).forEach(
                    ([trackerType, trackerResourceId]) => {
                        const currentTracker =
                            this.#trackerChoiceOptions[game]?.[trackerType];
                        const currentKey = currentTracker
                            ? getTrackerKey(currentTracker)
                            : null;
                        const newKey = getTrackerKey(trackerResourceId);
                        if (currentKey !== newKey) {
                            changedGames.add(game);
                        }
                    }
                );
            });
            this.#trackerChoiceOptions = newOptions;
            this.#callTrackerCallbacks(changedGames);
        });
    }

    /**
     * Adds a repository to the manager
     * @param repo
     */
    addRepository = (repo: ResourceRepository) => {
        this.#repositories.get(repo.uuid)?.listenerCleanUp();

        const updateRepositoryTrackers = () => {
            this.#directoryModified = Date.now();
            const trackersToRemove: Set<string> = new Set(
                this.#getTrackersInRepository(repo)
            );
            const trackerOptions = this.#trackerChoiceOptions;
            /** List of currently selected trackers that are being loaded in */
            const changedGameTrackers: Set<GameId> = new Set();
            repo.resources.forEach((manifest) => {
                if (
                    [
                        ResourceType.itemTracker,
                        ResourceType.locationTracker,
                    ].includes(manifest.type)
                ) {
                    this.#allTrackers.set(getTrackerKey(manifest), manifest);
                    this.#trackerRepositoryMap.set(
                        getTrackerKey(manifest),
                        repo.uuid
                    );
                    // trigger reload if currently loaded tracker was updated
                    Object.entries(trackerOptions).forEach(
                        ([game, trackers]) => {
                            if (manifest.game === game) {
                                Object.entries(trackers).forEach(
                                    ([_, trackerResourceId]) => {
                                        if (
                                            getTrackerKey(trackerResourceId) ===
                                            getTrackerKey(manifest)
                                        ) {
                                            changedGameTrackers.add(game);
                                        }
                                    }
                                );
                            }
                        }
                    );
                    trackersToRemove.delete(getTrackerKey(manifest));
                }
            });
            trackersToRemove.forEach((trackerKey) => {
                const tracker = this.#allTrackers.get(trackerKey);
                const inUseTracker = this.getCurrentGameTracker(
                    tracker.game,
                    tracker.type
                );
                if (
                    inUseTracker.uuid === tracker.uuid &&
                    inUseTracker.version === tracker.version
                ) {
                    changedGameTrackers.add(tracker.game);
                }
                this.#allTrackers.delete(trackerKey);
            });
            this.#callDirectoryCallbacks();
            if (changedGameTrackers.size > 0) {
                this.#callTrackerCallbacks(changedGameTrackers);
            }
        };
        const subCall = repo.getUpdateSubscriber([
            ResourceType.locationTracker,
            ResourceType.itemTracker,
        ]);
        const listenerCleanUp = subCall(updateRepositoryTrackers);
        this.#repositories.set(repo.uuid, { repo, listenerCleanUp });
        updateRepositoryTrackers();
    };

    /**
     * Removes the repository and its related tracker resources from the manager
     * @param repo The repository to remove
     */
    removeRepository = (repo: ResourceRepository) => {
        this.#repositories.get(repo.uuid)?.listenerCleanUp();
        this.#directoryModified = Date.now();
        const trackersToRemove = this.#getTrackersInRepository(repo);
        const changedGameTrackers: Set<GameId> = new Set();
        trackersToRemove.forEach((trackerKey) => {
            const tracker = this.#allTrackers.get(trackerKey);
            if (
                tracker?.game &&
                this.getCurrentGameTracker(tracker.game, tracker.type)?.uuid ===
                    tracker.uuid
            ) {
                changedGameTrackers.add(tracker.game);
            }
            this.#allTrackers.delete(trackerKey);
        });
        this.#callDirectoryCallbacks();
        if (changedGameTrackers.size > 0) {
            this.#callTrackerCallbacks(changedGameTrackers);
        }
    };

    /**
     * Gets the tracker id of the tracker to use for a given game of a given type
     * @param game The name of the game to get the tracker for
     * @param type The type of tracker, which is a type of resource.
     * @returns The tracker id of the tracker to use, will fallback to a default if user's choice cannot be loaded or is not selected
     */
    getCurrentGameTracker = (game: string, type: ResourceType) => {
        const selectedOption =
            this.#trackerChoiceOptions[game] ?? this.#defaults;
        const trackerId = selectedOption[type] ?? this.#defaults[type];
        if (!this.#allTrackers.has(getTrackerKey(trackerId))) {
            return this.#defaults[type];
        }
        return trackerId;
    };

    /**
     * Gets a cached copy of the directory
     * @returns a cached copy of the directory
     */
    getDirectory = (): TrackerDirectory => {
        if (this.#directoryModified === this.#cachedDirectory[modified]) {
            return this.#cachedDirectory;
        }
        const games: Set<string> = new Set();
        const trackers: { [type: string]: ResourceManifest[] } = {};
        this.#allTrackers.forEach((manifest) => {
            games.add(manifest.game);
            if (!trackers[manifest.type]) {
                trackers[manifest.type] = [];
            }
            trackers[manifest.type].push(manifest);
        });
        this.#cachedDirectory = {
            games: [...games.values()],
            trackers,
            [modified]: this.#directoryModified,
        };
        return this.#cachedDirectory;
    };

    /**
     * Loads the provided tracker using the provided game package.
     * @param trackerId The id object of the resource to find and load
     * @param gamePackage The package of the game that is about to be loaded
     * @returns A initialized item or location tracker for the given tracker id.
     */
    loadTracker = async (
        trackerId: TrackerResourceId,
        gamePackage: GamePackageWrapper
    ) => {
        const trackerKey = getTrackerKey(trackerId);
        if (!this.#allTrackers.has(trackerKey)) {
            return null;
        }
        const repoId = this.#trackerRepositoryMap.get(trackerKey);
        if (!repoId) {
            console.warn(`Failed to find tracker's repository ${trackerKey}`);
            return null;
        }
        const repo = this.#repositories.get(repoId)?.repo;
        if (!repo) {
            console.warn(
                `Failed to locate repository ${repoId} for tracker ${trackerKey}`
            );
            return null;
        }
        const tracker = await repo.loadResource(
            trackerId.uuid,
            trackerId.version,
            trackerId.type,
            gamePackage
        );
        if (tracker instanceof CustomLocationTracker) {
            tracker.validateLocations();
            const errors = tracker.getErrors();
            if (errors.length > 0) {
                NotificationManager.createToast({
                    message: "Tracker has failed verification",
                    details: `Tracker has failed verification and may not work as expected.\nErrors: \n${errors.join("\n\n")}`,
                    type: MessageType.warning,
                    duration: 10,
                });
            }
        }
        return tracker as ItemTracker | LocationTracker;
    };

    /**
     * Adds the provided callback to be called when the tracker directory is updated
     * @param callback The callback to call when the directory's contents have changed
     * @returns A callback to remove the callback from the list of callbacks
     */
    addDirectoryUpdateCallback = (callback: () => void) => {
        this.#directoryCallbacks.add(callback);
        return () => {
            this.#directoryCallbacks.delete(callback);
        };
    };

    /**
     * Adds the provided callback to be called when the named game's tracker has been changed
     * @param game The name of the game. If null, callback will be triggered for all games
     * @param callback The callback to call when the named game's tracker has been changed
     * @returns A cleanup callback to remove the callback from the list of callbacks
     */
    addGameTrackerCallback = (game: GameId | null, callback: () => void) => {
        const gameCallbacks = this.#gameTrackerCallbacks.get(game) ?? new Set();
        gameCallbacks.add(callback);
        this.#gameTrackerCallbacks.set(game, gameCallbacks);
        return () => {
            gameCallbacks.delete(callback);
        };
    };

    /** Sets up a particular tracker to be used for a game */
    setGameTracker = (
        game: string,
        tracker: TrackerResourceId | { type: string }
    ) => {
        // console.log(`Updating ${game} to:`, tracker);
        if (game) {
            const currentValue =
                (this.#optionsStore.read(game) as TrackerResourceIds) ?? {};
            const newValue: TrackerResourceIds = {
                ...currentValue,
            };
            if ("uuid" in tracker) {
                newValue[tracker.type] = tracker;
            } else {
                delete newValue[tracker.type];
            }
            // tracker should auto reload with change on settings store, no need to trigger manually
            this.#optionsStore.write(newValue, game);
        } else {
            if ("uuid" in tracker) {
                this.#defaults[tracker.type] = tracker;
                // todo reload tracker when default is changed
            } else {
                throw new Error(
                    "Default tracker must be set, cannot be deleted"
                );
            }
        }
    };

    #callTrackerCallbacks = (
        games: Iterable<GameId>,
        includeGameFreeCallbacks = true
    ) => {
        console.log("GAME TRACKER CALLBACK", games);
        if (includeGameFreeCallbacks) {
            this.#gameTrackerCallbacks
                .get(null)
                ?.forEach((callback) => callback());
        }

        for (const game of games) {
            this.#gameTrackerCallbacks
                .get(game)
                ?.forEach((callback) => callback());
        }
    };

    #getTrackersInRepository = (repo: ResourceRepository) => {
        return [...this.#allTrackers.entries()]
            .filter(
                ([_, manifest]) =>
                    this.#trackerRepositoryMap.get(getTrackerKey(manifest)) ===
                    repo.uuid
            )
            .map(([_, manifest]) => getTrackerKey(manifest));
    };

    #callDirectoryCallbacks = () => {
        this.#directoryCallbacks.forEach((callback) => callback());
    };
}

export { TrackerManager };
export type {
    TrackerChoiceOptions,
    TrackerDirectory,
    TrackerResourceId,
    TrackerResourceIds,
};
