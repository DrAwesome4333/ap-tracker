// Loads 0.2.x trackers into the new 0.3.x format.
import { DB_STORE_KEYS, SaveData } from "../../saveData";
import { CustomTrackerRepository } from "../customTrackerManager";
const CUSTOM_TRACKER_DIRECTORY_STORAGE_KEY =
    "APChecklist_Custom_Tracker_Directory";

interface CustomListDirectory {
    customLists: { id: string; game: string; name: string; enabled: boolean }[];
    modified: number;
    ported?: boolean;
    version?: 1;
}

const readDirectoryFromStorage = (): CustomListDirectory => {
    const directoryDataString = localStorage.getItem(
        CUSTOM_TRACKER_DIRECTORY_STORAGE_KEY
    );
    const directory: CustomListDirectory = directoryDataString
        ? JSON.parse(directoryDataString)
        : {
              customLists: [],
              modified: 0,
              version: 1,
              ported: true, // nothing to port, so no need to change what is reported
          };
    return directory;
};

const saveDirectory = (directory: CustomListDirectory) => {
    directory.modified = Date.now();
    localStorage.setItem(
        CUSTOM_TRACKER_DIRECTORY_STORAGE_KEY,
        JSON.stringify(directory)
    );
};

const getCustomTracker = async (
    id: string
): Promise<CustomLocationTrackerDef_V1> => {
    return (await SaveData.getItem(
        DB_STORE_KEYS.customTrackers_old,
        id
    )) as CustomLocationTrackerDef_V1;
};

const portTrackers = async (
    customTrackerRepository: CustomTrackerRepository,
    force = false
) => {
    const directory = readDirectoryFromStorage();
    if (directory.ported && !force) {
        return;
    }
    const trackerPromises = directory.customLists.map((metaData) =>
        getCustomTracker(metaData.id).then((trackerDef) =>
            customTrackerRepository.addTracker(trackerDef)
        )
    );
    await Promise.all(trackerPromises);
    directory.ported = true;
    saveDirectory(directory);
};

export { portTrackers };
