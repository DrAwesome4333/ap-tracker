import { DataStore } from "../dataStores";
import LocationReport from "./locationTrackers/LocationReport";
import { LocationTrackerType, ResourceType } from "./resourceEnums";
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
    [game: string]: {
        [type: string]: TrackerResourceId;
    };
};

const nullSection = {
    id: "root",
    title: "Unloaded Tracker",
    locationReport: new LocationReport(),
    locations: [],
    theme: {
        color: "red",
    },
    children: [],
    parents: [],
};

const nullLocationTracker: DropdownLocationTracker = {
    manifest: {
        uuid: "00000000-0000-0000-0000-000000000000",
        name: "Unloaded tracker",
        formatVersion: 2,
        version: "0.0.0",
        type: ResourceType.locationTracker,
        locationTrackerType: LocationTrackerType.dropdown,
        repositoryUuid: "00000000-0000-0000-0000-000000000000",
        game: null,
    },
    type: LocationTrackerType.dropdown,
    getSection: () => nullSection,
    exportDropdowns: () => {},
    getUpdateSubscriber: () => {
        return () => {
            return () => {};
        };
    },
};

class TrackerManager {
    #repositories: Map<
        string,
        { repo: ResourceRepository; listenerCleanUp: () => void }
    > = new Map();
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

    #locationTracker: LocationTracker = nullLocationTracker;
    #itemTracker: ItemTracker = null;
    #game: string = null;
    #defaults: TrackerResourceIds = {
        [ResourceType.locationTracker]: {
            uuid: "00000000-0000-0000-0000-000000000000",
            version: "0.0.0",
            type: ResourceType.locationTracker,
        },
        [ResourceType.itemTracker]: {
            uuid: "00000000-0000-0000-0000-000000000000",
            version: "0.0.0",
            type: ResourceType.itemTracker,
        },
    };

    constructor(optionStore: DataStore) {
        this.#optionsStore = optionStore;
        this.#trackerChoiceOptions =
            (this.#optionsStore.read() as TrackerChoiceOptions) ?? {};
        const subscriber = this.#optionsStore.getUpdateSubscriber();
        subscriber(() => {
            this.#trackerChoiceOptions =
                this.#optionsStore.read() as TrackerChoiceOptions;
            const newGameInfo = this.#trackerChoiceOptions[this.#game];
            if (
                newGameInfo?.locationTracker.uuid !==
                    this.#locationTracker.manifest.uuid ||
                (newGameInfo?.locationTracker.uuid ===
                    this.#locationTracker.manifest.uuid &&
                    newGameInfo.locationTracker.version !==
                        this.#locationTracker.manifest.version)
            ) {
                this.loadTrackers(this.#game, this.#defaults);
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
                    if (this.#allTrackers.has(manifest.uuid)) {
                        // todo deal with duplicates in a graceful manner
                        console.warn(
                            "Trackers with duplicate ids added, second was ignored with id:",
                            manifest.uuid
                        );
                    } else {
                        this.#allTrackers.set(manifest.uuid, manifest);
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
                this.loadTrackers(this.#game, this.#defaults);
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

    loadTrackers = async (
        game: string,
        defaults: TrackerResourceIds
    ): Promise<void> => {
        const trackerOptions = this.#trackerChoiceOptions ?? {};
        this.#defaults = defaults;
        let locationTrackerInfo = this.#allTrackers.get(
            trackerOptions[game]?.locationTracker?.uuid
        );
        locationTrackerInfo ??= this.#allTrackers.get(
            defaults[ResourceType.locationTracker]?.uuid
        );
        let itemTrackerInfo = this.#allTrackers.get(
            trackerOptions[game]?.itemTracker?.uuid
        );
        itemTrackerInfo ??= this.#allTrackers.get(
            defaults[ResourceType.itemTracker]?.uuid
        );
        const locationTrackerPromise = this.#repositories
            .get(locationTrackerInfo?.repositoryUuid)
            ?.repo.loadResource(
                locationTrackerInfo.uuid,
                locationTrackerInfo.version
            )
            .then((tracker) => {
                this.#locationTracker =
                    (tracker as LocationTracker) ?? nullLocationTracker;
                this.#callTrackerListeners();
            });
        const itemTrackerPromise = this.#repositories
            .get(itemTrackerInfo?.repositoryUuid)
            ?.repo.loadResource(itemTrackerInfo.uuid, itemTrackerInfo.version)
            .then((tracker) => {
                this.#itemTracker = tracker as ItemTracker;
                this.#callTrackerListeners();
            });
        const trackerPromises = [locationTrackerPromise, itemTrackerPromise];
        await Promise.all(trackerPromises);
    };

    getCurrentGameTracker = (game: string, type: ResourceType) => {
        const selectedOption = this.#trackerChoiceOptions[game];
        if (selectedOption) {
            if (type === ResourceType.locationTracker) {
                return selectedOption.locationTracker;
            }
            if (type === ResourceType.itemTracker) {
                return selectedOption.itemTracker;
            }
        }
        return null;
    };

    getCurrentTracker = (type: ResourceType) => {
        switch (type) {
            case ResourceType.itemTracker: {
                return this.#itemTracker;
            }
            case ResourceType.locationTracker: {
                return this.#locationTracker;
            }
        }
    };
}

export { TrackerManager };
export type { TrackerChoiceOptions, TrackerDirectory };
