import { globalOptionManager } from "../options/optionManager";
import LocationReport from "./locationTrackers/LocationReport";
import { LocationTrackerType, ResourceType } from "./resourceEnums";
const modified = Symbol("modified");

type TrackerDirectory = {
    games: string[],
    locationTrackers: LocationTrackerManifest[]
    itemTrackers: ItemTrackerManifest[],
    [modified]: number,
}

type TrackerChoiceOptions = {
    [game: string]: {
        locationTracker: {
            uuid: string,
            version: string
        },
        itemTracker: {
            uuid: string,
            version: string
        }
    }
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
    exportDropdowns: () => { },
    getUpdateSubscriber: () => {
        return () => {
            return () => { }
        }
    }
}

globalOptionManager.setOptionDefault("TrackerChoices", "global", {});

class TrackerManager {
    #repositories: Map<string, { repo: ResourceRepository, listenerCleanUp: () => void }> = new Map();
    #allTrackers: Map<string, LocationTrackerManifest | ItemTrackerManifest> = new Map();
    #directoryListeners: Set<() => void> = new Set();
    #trackerListeners: Set<() => void> = new Set();
    #directoryModified = Date.now();
    #cachedDirectory: TrackerDirectory = {
        games: [],
        locationTrackers: [],
        itemTrackers: [],
        [modified]: 0
    };

    #trackerChoiceOptions: TrackerChoiceOptions = {};
    #locationTracker: LocationTracker = nullLocationTracker;
    #itemTracker: ItemTracker = null;
    #game: string = null;
    #defaults: {
        location: string,
        item: string,
    } = {
            location: "00000000-0000-0000-0000-000000000000",
            item: "00000000-0000-0000-0000-000000000000",
        }

    #getTrackersInRepository = (repo: ResourceRepository) => {
        return [...this.#allTrackers.entries()].filter(([_, manifest]) => manifest.repositoryUuid === repo.uuid).map(([uuid, _]) => uuid);
    }

    #callDirectoryListeners = () => {
        this.#directoryListeners.forEach(listener => listener());
    }

    #callTrackerListeners = (_type?: ResourceType) => {
        this.#trackerListeners.forEach(listener => listener());
    }

    removeRepository = (repo: ResourceRepository) => {
        this.#repositories.get(repo.uuid)?.listenerCleanUp();
        const trackersToRemove = this.#getTrackersInRepository(repo);
        trackersToRemove.forEach((trackerId) => this.#allTrackers.delete(trackerId));

    }

    addRepository = (repo: ResourceRepository) => {
        this.#repositories.get(repo.uuid)?.listenerCleanUp();

        const updateRepositoryTrackers = () => {
            this.#directoryModified = Date.now();
            const trackersToRemove: Set<string> = new Set(this.#getTrackersInRepository(repo));
            const trackerOptions = globalOptionManager.getOptionValue("TrackerChoices", "global") as TrackerChoiceOptions;
            let triggerReload = false;
            repo.resources.forEach((manifest) => {
                if (manifest.type === ResourceType.itemTracker || manifest.type === ResourceType.locationTracker) {
                    if (this.#allTrackers.has(manifest.uuid)) {
                        // todo deal with duplicates in a graceful manner
                        console.warn("Trackers with duplicate ids added, second was ignored with id:", manifest.uuid);
                    } else {
                        this.#allTrackers.set(manifest.uuid, manifest);
                        if (manifest.uuid === trackerOptions[this.#game]?.locationTracker.uuid || manifest.uuid === trackerOptions[this.#game]?.itemTracker.uuid || manifest.uuid === this.#defaults.item || manifest.uuid === this.#defaults.location) {
                            triggerReload = true;
                        }
                    }
                    trackersToRemove.delete(manifest.uuid);
                }
            });
            trackersToRemove.forEach((trackerId) => this.#allTrackers.delete(trackerId));
            this.#callDirectoryListeners();
            if (triggerReload) {
                this.loadTrackers(this.#game, this.#defaults);
            }
        }
        const subCall = repo.getUpdateSubscriber([ResourceType.locationTracker, ResourceType.itemTracker]);
        const listenerCleanUp = subCall(updateRepositoryTrackers);
        this.#repositories.set(repo.uuid, { repo, listenerCleanUp });
        updateRepositoryTrackers();

    }

    getTrackerSubscriberCallback: (_type?: ResourceType) => (listener: () => void) => () => void = () => {
        return (listener) => {
            this.#trackerListeners.add(listener);
            return () => {
                this.#trackerListeners.delete(listener);
            };
        };
    }

    getDirectorySubscriberCallback: () => (listener: () => void) => () => void = () => {
        return (listener) => {
            this.#directoryListeners.add(listener);
            return () => {
                this.#directoryListeners.delete(listener);
            };
        };
    }

    getDirectory = (): TrackerDirectory => {
        if (this.#directoryModified === this.#cachedDirectory[modified]) {
            return this.#cachedDirectory;
        }
        const games: Set<string> = new Set();
        const locationTrackers: LocationTrackerManifest[] = [];
        const itemTrackers: ItemTrackerManifest[] = [];
        this.#allTrackers.forEach((manifest) => {
            games.add(manifest.game);
            if (manifest.type === ResourceType.itemTracker) {
                itemTrackers.push(manifest);
            }
            if (manifest.type === ResourceType.locationTracker) {
                // not sure why I need to be explicit here about the type.
                locationTrackers.push(manifest as LocationTrackerManifest);
            }
        });
        this.#cachedDirectory = {
            games: [...games.values()],
            locationTrackers,
            itemTrackers,
            [modified]: this.#directoryModified,
        };
        return this.#cachedDirectory;
    }

    loadTrackers = async (game: string, defaults: { location: string, item: string }): Promise<void> => {
        const trackerOptions = globalOptionManager.getOptionValue("TrackerChoices", "global") as TrackerChoiceOptions;
        this.#defaults = defaults;
        let locationTrackerInfo = this.#allTrackers.get(trackerOptions[game]?.locationTracker?.uuid);
        locationTrackerInfo ??= this.#allTrackers.get(defaults.location);
        let itemTrackerInfo = this.#allTrackers.get(trackerOptions[game]?.itemTracker?.uuid);
        itemTrackerInfo ??= this.#allTrackers.get(defaults.item);
        const locationTrackerPromise = this.#repositories.get(locationTrackerInfo?.repositoryUuid)?.repo.loadResource(locationTrackerInfo.uuid, locationTrackerInfo.version).then((tracker) => {
            this.#locationTracker = tracker as LocationTracker ?? nullLocationTracker;
            this.#callTrackerListeners();
        });
        const itemTrackerPromise = this.#repositories.get(itemTrackerInfo?.repositoryUuid)?.repo.loadResource(itemTrackerInfo.uuid, itemTrackerInfo.version).then((tracker) => {
            this.#itemTracker = tracker as ItemTracker;
            this.#callTrackerListeners();
        });
        const trackerPromises = [locationTrackerPromise, itemTrackerPromise];
        await Promise.all(trackerPromises);
    }

    getCurrentGameTracker = (game: string, type: ResourceType) => {
        const trackerOptions = globalOptionManager.getOptionValue("TrackerChoices", "global") as TrackerChoiceOptions;
        const selectedOption = trackerOptions[game];
        if(selectedOption){
            if(type === ResourceType.locationTracker){
                return selectedOption.locationTracker;
            }
            if(type === ResourceType.itemTracker){
                return selectedOption.itemTracker;
            }
        }
        return null;
    }

    getCurrentTracker = (type: ResourceType) => {
        switch (type) {
            case ResourceType.itemTracker: {
                return this.#itemTracker;
            }
            case ResourceType.locationTracker: {
                return this.#locationTracker;
            }
        }
    }
}

export { TrackerManager }
export type {TrackerChoiceOptions, TrackerDirectory}
