// @ts-check
import { useSyncExternalStore } from "react";
import CustomTrackerManager from "../games/generic/categoryGenerators/customTrackerManager";
import TrackerManager from "../games/TrackerManager";

const useTrackerDirectory = () => {
    return useSyncExternalStore(
        TrackerManager.directory.getSubscriberCallback(),
        TrackerManager.directory.getDirectory,
        TrackerManager.directory.getDirectory
    );
};

const useCustomTrackerDirectory = () => {
    return useSyncExternalStore(
        CustomTrackerManager.getDirectorySubscriberCallback(),
        CustomTrackerManager.getDirectory,
        CustomTrackerManager.getDirectory
    );
};

const useCurrentGameTracker = (game: string, trackerManager: TrackerManager) => {
    return useSyncExternalStore(
        trackerManager.getTrackerSubscriberCallback(),
        () => trackerManager.getGameTracker(game),
        () => trackerManager.getGameTracker(game)
    );
};

export {
    useTrackerDirectory,
    useCurrentGameTracker,
    useCustomTrackerDirectory,
};
