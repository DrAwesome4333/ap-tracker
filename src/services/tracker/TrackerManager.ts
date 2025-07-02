import { DataStore } from "../dataStores";
import GenericLocationTracker from "./generic/genericTracker";
import { ResourceType } from "./resourceEnums";
const modified = Symbol("modified");

type TrackerDirectory = {
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

const getTrackerKey = (tracker: TrackerResourceId) => {
    return tracker
        ? `${tracker.uuid}-${tracker.version}-${tracker.type}`
        : null;
};

class TrackerManager {
    #repositories: Map<
        string,
        { repo: ResourceRepository; listenerCleanUp: () => void }
    > = new Map();
    #trackerRepositoryMap: Map<string, string> = new Map();
    #allTrackers: Map<string, LocationTrackerManifest | ItemTrackerManifest> =
        new Map();
    #directoryListeners: Set<() => void> = new Set();
    #trackerListeners: Set<() => void> = new Set();
    #directoryModified = Date.now();
    #cachedDirectory: TrackerDirectory = {
        games: [],
        trackers: {
            [ResourceType.locationTracker]: [],
            [ResourceType.itemTracker]: [],
        },
        [modified]: 0,
    };

    #trackerChoiceOptions: TrackerChoiceOptions = {};
    #optionsStore: DataStore;
    #trackers: {
        [type: string]: LocationTracker | ItemTracker;
    } = {};
    #game: string = null;
    #defaults: TrackerResourceIds = {
        [ResourceType.locationTracker]: {
            uuid: GenericLocationTracker.uuid,
            version: "0.0.0",
            type: ResourceType.locationTracker,
        },
        [ResourceType.itemTracker]: {
            uuid: "",
            version: "0.0.0",
            type: ResourceType.itemTracker,
        },
    };

    constructor(optionStore: DataStore) {
        this.#optionsStore = optionStore;
        this.#trackerChoiceOptions =
            (this.#optionsStore.read() as TrackerChoiceOptions) ?? {};
        const subscribe = this.#optionsStore.getUpdateSubscriber();
        subscribe(() => {
            this.#trackerChoiceOptions =
                this.#optionsStore.read() as TrackerChoiceOptions;
            const newGameInfo = this.#trackerChoiceOptions[this.#game] ?? {};
            const changes = Object.entries(this.#trackers).filter(
                ([type, tracker]) =>
                    tracker?.manifest.uuid !== newGameInfo[type]?.uuid ||
                    tracker?.manifest.version !== newGameInfo[type]?.version
            );
            if (changes.length > 0) {
                this.loadTrackers(this.#game);
            } else {
                this.#callTrackerListeners();
            }
            this.#callDirectoryListeners();
        });
    }

    #getTrackersInRepository = (repo: ResourceRepository) => {
        return [...this.#allTrackers.entries()]
            .filter(([_, manifest]) => manifest.repositoryUuid === repo.uuid)
            .map(([uuid, _]) => uuid);
    };

    #callDirectoryListeners = () => {
        this.#directoryListeners.forEach((listener) => listener());
    };

    #callTrackerListeners = (_type?: ResourceType) => {
        this.#trackerListeners.forEach((listener) => listener());
    };

    removeRepository = (repo: ResourceRepository) => {
        this.#repositories.get(repo.uuid)?.listenerCleanUp();
        const trackersToRemove = this.#getTrackersInRepository(repo);
        trackersToRemove.forEach((trackerId) =>
            this.#allTrackers.delete(trackerId)
        );
    };

    addRepository = (repo: ResourceRepository) => {
        this.#repositories.get(repo.uuid)?.listenerCleanUp();

        const updateRepositoryTrackers = () => {
            this.#directoryModified = Date.now();
            const trackersToRemove: Set<string> = new Set(
                this.#getTrackersInRepository(repo)
            );
            const trackerOptions = this.#trackerChoiceOptions;
            const currentTrackers = trackerOptions[this.#game];
            let triggerReload = false;
            repo.resources.forEach((manifest) => {
                if (
                    manifest.type === ResourceType.itemTracker ||
                    manifest.type === ResourceType.locationTracker
                ) {
                    if (this.#allTrackers.has(getTrackerKey(manifest))) {
                        // todo deal with duplicates in a graceful manner
                        console.warn(
                            "Trackers with duplicate ids added, second was ignored with id:",
                            manifest.uuid
                        );
                    } else {
                        this.#allTrackers.set(
                            getTrackerKey(manifest),
                            manifest
                        );
                        this.#trackerRepositoryMap.set(
                            getTrackerKey(manifest),
                            repo.uuid
                        );
                        if (
                            manifest.game === this.#game &&
                            Object.entries({
                                ...this.#defaults,
                                ...currentTrackers,
                            }).filter(
                                ([type, resource]) =>
                                    resource.uuid === manifest.uuid &&
                                    manifest.version === resource.version &&
                                    manifest.type === type
                            ).length > 1
                        ) {
                            triggerReload = true;
                        }
                    }
                    trackersToRemove.delete(manifest.uuid);
                }
            });
            trackersToRemove.forEach((trackerId) =>
                this.#allTrackers.delete(trackerId)
            );
            this.#callDirectoryListeners();
            if (triggerReload) {
                this.loadTrackers(this.#game);
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

    getTrackerSubscriberCallback: (
        _type?: ResourceType
    ) => (listener: () => void) => () => void = () => {
        return (listener) => {
            this.#trackerListeners.add(listener);
            return () => {
                this.#trackerListeners.delete(listener);
            };
        };
    };

    getDirectorySubscriberCallback: () => (listener: () => void) => () => void =
        () => {
            return (listener) => {
                this.#directoryListeners.add(listener);
                return () => {
                    this.#directoryListeners.delete(listener);
                };
            };
        };

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

    setGameTracker = (
        game: string,
        tracker: TrackerResourceId | { type: string }
    ) => {
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
            this.#optionsStore.write(newValue, game);
            // tracker should auto reload with change on settings store
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

    loadTrackers = async (game: string): Promise<void> => {
        this.#game = game;
        const locationTrackerInfo = this.getCurrentGameTracker(
            game,
            ResourceType.locationTracker
        );
        const itemTrackerInfo = this.getCurrentGameTracker(
            game,
            ResourceType.itemTracker
        );
        const locationTrackerRepoUuid = this.#trackerRepositoryMap.get(
            getTrackerKey(locationTrackerInfo)
        );
        const itemTrackerRepoUuid = this.#trackerRepositoryMap.get(
            getTrackerKey(itemTrackerInfo)
        );

        const locationTrackerPromise = this.#repositories
            .get(locationTrackerRepoUuid)
            ?.repo.loadResource(
                locationTrackerInfo.uuid,
                locationTrackerInfo.version,
                locationTrackerInfo.type
            )
            .then((tracker) => {
                this.#trackers[ResourceType.locationTracker] =
                    tracker as LocationTracker;
                this.#callTrackerListeners();
            });
        const itemTrackerPromise = this.#repositories
            .get(itemTrackerRepoUuid)
            ?.repo.loadResource(
                itemTrackerInfo.uuid,
                itemTrackerInfo.version,
                itemTrackerInfo.type
            )
            .then((tracker) => {
                this.#trackers[ResourceType.itemTracker] =
                    tracker as ItemTracker;
                this.#callTrackerListeners();
            });
        const trackerPromises = [locationTrackerPromise, itemTrackerPromise];
        await Promise.all(trackerPromises);
    };

    getCurrentGameTracker = (game: string, type: ResourceType) => {
        const selectedOption =
            this.#trackerChoiceOptions[game] ?? this.#defaults;
        return selectedOption[type] ?? this.#defaults[type];
    };

    getCurrentTracker = (type: ResourceType) => {
        return this.#trackers[type];
    };
}

export { TrackerManager };
export type {
    TrackerChoiceOptions,
    TrackerDirectory,
    TrackerResourceId,
    TrackerResourceIds,
};
