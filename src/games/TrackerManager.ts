import { LocationManager } from "../services/locations/locationManager";
import { EntranceManager } from "../services/entrances/entranceManager";
import { GroupManager } from "../services/sections/groupManager";
import { SectionManager } from "../services/sections/sectionManager";
import { GenericGameMethod } from "./generic/categoryGenerators/genericGameEnums";
import { buildGenericGame } from "./generic/genericGame";

const modified = Symbol("modified");
const TRACKER_CHOICE_KEY = "Archipelago_Checklist_saved_tracker_choices";

type TrackerBuilder = (locationManager: LocationManager, entranceManager: EntranceManager, groupManager: GroupManager, sectionManager: SectionManager, slotData: unknown) => void;
type TrackerInitParams = {
    gameName: string
    entranceManager: EntranceManager,
    slotData?: unknown,
    groups: { [groupName: string]: string[] },
}

interface Tracker {
    name: string;
    gameName: string;
    id: string;
    gameTitle?: string;
    gameAbbreviation?: string;
    buildTracker: TrackerBuilder;
    exportTracker?: () => import("./generic/categoryGenerators/customTrackerManager").CustomCategory_V1;
}

/** Manages list of registered trackers and can be used to initialize them */
class TrackerManager {
    #registeredTrackers: Map<string, Tracker> = new Map();
    #trackerListeners: Set<() => void> = new Set();
    #trackerParams: TrackerInitParams = null;
    #locationManager: LocationManager;
    #sectionManager: SectionManager;
    #groupManager: GroupManager;
    static #managers: Set<TrackerManager> = new Set();
    static #allTrackers: Map<string, Tracker> = new Map();
    static #trackersByGame: Map<string, Set<string>> = new Map();
    static #directoryListeners: Set<() => void> = new Set();
    static #directoryModified = Date.now();
    static #cachedDirectory: { games: string[]; trackers: Tracker[];[modified]: number; } = {
        games: [],
        trackers: [],
        [modified]: 0,
    };
    static #callDirectoryListeners = () => {
        TrackerManager.#directoryListeners.forEach((listener) => listener());
    }
    static directory = {
        getSubscriberCallback: (): (listener: () => void) => (() => void) => {
            return (listener) => {
                TrackerManager.#directoryListeners.add(listener);
                return () => {
                    TrackerManager.#directoryListeners.delete(listener);
                };
            };
        },
        getDirectory: (): { games: string[]; trackers: Tracker[]; } => {
            if (TrackerManager.#directoryModified > TrackerManager.#cachedDirectory[modified]) {
                const result = {
                    games: [...TrackerManager.#trackersByGame.keys()],
                    trackers: [...TrackerManager.#allTrackers.values()],
                    [modified]: Date.now(),
                };
                TrackerManager.#cachedDirectory = result;
            }
            return TrackerManager.#cachedDirectory;
        },
        addTracker: (tracker: Tracker) => {
            if (tracker.gameName === undefined) {
                throw new Error(
                    "Failed to register tracker, trackers must have a game name. Generic trackers can be registered with empty strings"
                );
            }
            TrackerManager.#allTrackers.set(tracker.id, tracker);
            const currentTrackers = TrackerManager.#trackersByGame.get(tracker.gameName) ?? new Set();
            currentTrackers.add(tracker.id);
            TrackerManager.#trackersByGame.set(tracker.gameName, currentTrackers);
            TrackerManager.#directoryModified = Date.now();
            TrackerManager.#callDirectoryListeners();
        },
        removeTracker: (trackerId: string) => {

            const tracker = TrackerManager.#allTrackers.get(trackerId);
            if (tracker) {
                TrackerManager.#allTrackers.delete(trackerId);
                const currentTrackers = TrackerManager.#trackersByGame.get(tracker.gameName) ?? new Set();
                currentTrackers.delete(tracker.id);
                if (currentTrackers.size > 0) {
                    TrackerManager.#trackersByGame.set(tracker.gameName, currentTrackers);
                } else {
                    TrackerManager.#trackersByGame.delete(tracker.gameName);
                }
                TrackerManager.#directoryModified = Date.now();
                TrackerManager.#managers.forEach(trackerManager => {
                    if (trackerManager.getGameTracker(tracker.gameName)?.id === tracker.id && tracker.id) {
                        trackerManager.setGameTracker(tracker.gameName, null);
                    }
                })
                TrackerManager.#callDirectoryListeners();
            }
        }
    }

    constructor(locationManager: LocationManager, groupManager: GroupManager, sectionManager: SectionManager) {
        TrackerManager.#managers.add(this);
        this.#locationManager = locationManager;
        this.#groupManager = groupManager;
        this.#sectionManager = sectionManager;
    }

    /** Returns a callback that can have a listener passed in that will be called when tracker changes occur and returns a clean up call.*/
    getTrackerSubscriberCallback = (): (listener: () => void) => (() => void) => {
        return (listener: () => void) => {
            this.#trackerListeners.add(listener);
            return () => {
                this.#trackerListeners.delete(listener);
            };
        };
    };

    setGameTracker = (game: string, _tracker: Tracker | string | null, save?: boolean) => {
        // TODO, make it so setting with game name of "" will set the default tracker for games
        if (!game) {
            throw new Error(
                "Game must be defined when setting tracker, for now..."
            );
        }

        const tracker: Tracker = typeof _tracker === "string" ? TrackerManager.#allTrackers.get(_tracker) : _tracker;
        if (!tracker && _tracker === "string") {
            throw new Error(`Failed to find tracker with id ${_tracker}`);
        }

        if (tracker) {
            this.#registeredTrackers.set(game, tracker)
        } else {
            this.#registeredTrackers.delete(game);
        }

        if (this.#trackerParams?.gameName === game) {
            this.reloadTracker();
        }

        if (save) {
            const savedChoicesString = localStorage.getItem(TRACKER_CHOICE_KEY);
            const trackerChoices = savedChoicesString
                ? JSON.parse(savedChoicesString)
                : {};
            if (tracker) {
                trackerChoices[game] = tracker.id;
            } else {
                delete trackerChoices[game];
            }
            localStorage.setItem(TRACKER_CHOICE_KEY, JSON.stringify(trackerChoices));
        }

        this.#callTrackerListeners();
    };

    getGameTracker = (game: string): Tracker | null => {
        return this.#registeredTrackers.get(game) ?? null;
    };

    reloadTracker = () => {
        if (!this.#trackerParams) {
            return;
        }
        const {
            gameName, entranceManager, slotData, groups
        } = this.#trackerParams;
        let tracker: Tracker = null;
        if (this.#registeredTrackers.has(gameName)) {
            tracker = this.#registeredTrackers.get(gameName);
        } else {
            tracker = buildGenericGame(gameName, this.#locationManager, groups, GenericGameMethod.locationGroup);
        }
        this.#sectionManager.deleteAllSections();
        tracker.buildTracker(
            this.#locationManager,
            entranceManager,
            this.#groupManager,
            this.#sectionManager,
            slotData
        );
    }

    initializeTracker = (initParams: TrackerInitParams) => {
        this.#trackerParams = initParams;
        this.reloadTracker();
    };

    /** Removes the manager from the list of managed managers */
    remove = () => {
        TrackerManager.#managers.delete(this);
    }

    loadSavedTrackerChoices = () => {
        const savedChoicesString = localStorage.getItem(TRACKER_CHOICE_KEY);
        const trackerChoices = savedChoicesString
            ? JSON.parse(savedChoicesString)
            : {};
        Object.getOwnPropertyNames(trackerChoices).forEach((gameName) => {
            const tracker = TrackerManager.#allTrackers.get(trackerChoices[gameName]);
            if (tracker) {
                this.setGameTracker(gameName, tracker);
            }
        });
    }

    getTrackerInitParams = (): TrackerInitParams => {
        return this.#trackerParams;
    }

    #callTrackerListeners = () => {
        this.#trackerListeners.forEach((listener) => listener());
    };

}

export default TrackerManager;
export type { Tracker, TrackerBuilder, TrackerInitParams }