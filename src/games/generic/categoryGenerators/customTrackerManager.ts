// Loads custom JSON supplied by users
import { generateId } from "../../../utility/randomIdGen";
import NotificationManager, {
    MessageType,
} from "../../../services/notifications/notifications";
import { verifyTrackerConfig } from "./trackerVerification";
import TrackerManager, { Tracker, TrackerBuilder } from "../../TrackerManager";
import { GroupData } from "../../../services/sections/groupManager";
import { SectionConfigData } from "../../../services/sections/sectionManager";
const CUSTOM_TRACKER_DIRECTORY_STORAGE_KEY =
    "APChecklist_Custom_Tracker_Directory";
const CUSTOM_TRACKER_STORAGE_KEY = "APChecklist_Custom_Tracker";
const CUSTOM_TRACKER_VERSION = 1;

interface CustomCategory_V1 {
    groupData: { [groupKey: string]: GroupData };
    sectionData: SectionConfigData;
    game: string;
    customTrackerVersion: number;
    id?: string;
    name: string;
}

interface CustomListDirectory {
    customLists: { id: string; game: string; name: string; enabled: boolean; }[];
    modified: number;
}


const buildCustomTracker = (gameName: string, customGameId: string): Tracker => {
    const customGameData = getCustomTracker(customGameId);
    if (!customGameData) {
        throw new Error("Failed to load custom game with id " + customGameId);
    }
    if (customGameData.game !== gameName) {
        throw new Error(
            `Provided game "${gameName}" does not match the custom tracker's with game "${customGameData.game}"`
        );
    }
    const { groupData, sectionData } = customGameData;

    const buildTracker: TrackerBuilder = (
        checkManager,
        _entranceManager,
        groupManager,
        sectionManager,
        _slotData
    ) => {
        const errors = verifyTrackerConfig(
            sectionData,
            groupData,
            checkManager
        );
        const errorMessage = errors.join("\n\n");
        if (errors.length > 0) {
            NotificationManager.createToast({
                message: "Custom tracker has failed verification checks.",
                details: errorMessage,
                type: MessageType.warning,
                duration: 30,
                id: "custom-tracker-validation",
            });
            console.warn("Custom tracker has failed verification", errors);
        }

        // configure groups and sections
        groupManager.loadGroups(groupData);
        sectionManager.setConfiguration(sectionData);
    };

    return {
        id: customGameId,
        gameName: customGameData.game,
        name: customGameData.name,
        buildTracker,
    };
};

const directoryListeners: Set<() => void> = new Set();

const getDirectorySubscriberCallback = (): (listener: () => void) => (() => void) => {
    return (listener) => {
        directoryListeners.add(listener);
        return () => {
            directoryListeners.delete(listener);
        };
    };
};

const callDirectoryListeners = () => {
    directoryListeners.forEach((listener) => listener());
};

const getDirectory = () => {
    return readDirectoryFromStorage();
};

let cachedDirectory: CustomListDirectory = {
    customLists: [],
    modified: 0,
};

const readDirectoryFromStorage = (): CustomListDirectory => {
    const directoryDataString = localStorage.getItem(
        CUSTOM_TRACKER_DIRECTORY_STORAGE_KEY
    );
    const directory = directoryDataString
        ? JSON.parse(directoryDataString)
        : {
            customLists: [],
            modified: 0,
        };
    // React requires returning the same object if nothing has changed
    if (directory.modified !== cachedDirectory.modified) {
        cachedDirectory = directory;
    }
    return cachedDirectory;
};

const saveDirectory = (directory: CustomListDirectory) => {
    directory.modified = Date.now();
    localStorage.setItem(
        CUSTOM_TRACKER_DIRECTORY_STORAGE_KEY,
        JSON.stringify(directory)
    );
    callDirectoryListeners();
};

const getCustomTracker = (id: string): CustomCategory_V1 | null => {
    const dataString = localStorage.getItem(
        `${CUSTOM_TRACKER_STORAGE_KEY}_${id}`
    );
    if (!dataString) {
        return null;
    }
    return JSON.parse(dataString);
};

/**
 * @param {CustomCategory_V1} data
 */
const addCustomTracker = (data: CustomCategory_V1) => {
    const directory = { ...readDirectoryFromStorage() };
    // validate data
    if (data.customTrackerVersion > CUSTOM_TRACKER_VERSION) {
        throw new Error(
            "Failed to add custom tracker, tracker version is newer than the supported version"
        );
    }
    if (!data.game) {
        throw new Error("Failed to add custom tracker, game was not specified");
    }
    if (!data.name) {
        throw new Error(
            "Failed to add custom tracker, a name was not specified"
        );
    }
    if (!data.groupData) {
        throw new Error("Failed to add custom tracker, no group data found");
    }
    if (!data.sectionData) {
        throw new Error("Failed to add custom tracker, no section data found");
    }

    const errors = verifyTrackerConfig(data.sectionData, data.groupData);
    if (errors.length > 0) {
        const errorMessage = errors.join("\n\n");
        if (errors.length > 0) {
            NotificationManager.createToast({
                message:
                    "Custom tracker has failed early verification checks and may not function as expected.",
                details: errorMessage,
                type: MessageType.warning,
                duration: 30,
                id: "custom-tracker-validation",
            });
            console.warn("Custom tracker has failed verification", errors);
        }
    }
    const currentIndex = directory.customLists.map(({ id }) => id === data.id).indexOf(true);
    if (currentIndex > -1) {
        // remove existing version from directory
        directory.customLists = directory.customLists.slice(0);
        directory.customLists.splice(currentIndex, 1);
    }
    const id = data.id ?? generateId();
    directory.customLists.push({
        id,
        game: data.game,
        name: data.name,
        enabled: true,
    });

    localStorage.setItem(
        `${CUSTOM_TRACKER_STORAGE_KEY}_${id}`,
        JSON.stringify(data)
    );
    saveDirectory(directory);
    try {
        TrackerManager.directory.addTracker(buildCustomTracker(data.game, id));
    } catch (e) {
        directory.customLists[directory.customLists.length - 1].enabled = false;
        saveDirectory(directory);
        NotificationManager.createToast({
            message:
                "An error occurred adding custom tracker, it has been disabled",
            details: `Error: \n\t${e}`,
            type: MessageType.error,
            duration: 10,
        });
        console.error(e);
    }
};

/**
 * @param {string} id
 */
const removeCustomTracker = (id: string) => {
    const directory = { ...readDirectoryFromStorage() };
    // validate data
    const currentIndex = directory.customLists.map(({ id: itemId }) => itemId === id).indexOf(true);
    if (currentIndex > -1) {
        TrackerManager.directory.removeTracker(id);
        // remove existing version from directory
        directory.customLists = directory.customLists.slice(0);
        directory.customLists.splice(currentIndex, 1);
    }
    localStorage.removeItem(`${CUSTOM_TRACKER_STORAGE_KEY}_${id}`);
    saveDirectory(directory);
};

const loadTrackers = () => {
    const directory = { ...readDirectoryFromStorage() }; // set the cached directory as well
    let encounteredErrors = false;
    cachedDirectory.customLists.forEach((trackerInfo, index) => {
        if (trackerInfo.enabled) {
            try {
                TrackerManager.directory.addTracker(
                    buildCustomTracker(trackerInfo.game, trackerInfo.id)
                );
            } catch (e) {
                encounteredErrors = true;
                directory.customLists[index].enabled = false;
                NotificationManager.createToast({
                    message: `An error occurred loading a custom tracker ${trackerInfo.name}, it has been disabled.`,
                    details: `Tracker info:\n\tName: ${trackerInfo.name} \n\tGame: ${trackerInfo.game}\n\tId:${trackerInfo.id}\nError: \n\t${e}`,
                    type: MessageType.warning,
                    duration: 10,
                });
                console.error(e);
            }
        }
    });
    if (encounteredErrors) {
        saveDirectory(directory);
    }
};

loadTrackers();

const CustomTrackerManager = {
    removeCustomTracker,
    addCustomTracker,
    getCustomTracker,
    getDirectory,
    getDirectorySubscriberCallback,
};

export default CustomTrackerManager;
export type {CustomCategory_V1 };
