import { useSyncExternalStore } from "react";
import { CustomTrackerRepository } from "../services/tracker/customTrackerRepository";
import { TrackerManager } from "../services/tracker/TrackerManager";
import { ResourceType } from "../services/tracker/resourceEnums";
import emptySyncCallback from "./emptyCallback";

const useTrackerDirectory = (trackerManager: TrackerManager) => {
    const callback = trackerManager
        ? trackerManager.getDirectorySubscriberCallback()
        : emptySyncCallback;
    return useSyncExternalStore(
        callback,
        () => trackerManager?.getDirectory(),
        () => trackerManager?.getDirectory()
    );
};

const useCustomTrackerDirectory = (
    customTrackerRepository: CustomTrackerRepository
) => {
    return useSyncExternalStore(
        customTrackerRepository.getUpdateSubscriber(),
        () => customTrackerRepository.resources,
        () => customTrackerRepository.resources
    );
};

const useCurrentGameTracker = (
    game: string,
    trackerManager: TrackerManager,
    type: ResourceType
) => {
    const callback = trackerManager
        ? trackerManager.getTrackerSubscriberCallback()
        : emptySyncCallback;
    return useSyncExternalStore(
        callback,
        () => trackerManager?.getCurrentGameTracker(game, type),
        () => trackerManager?.getCurrentGameTracker(game, type)
    );
};

export {
    useTrackerDirectory,
    useCurrentGameTracker,
    useCustomTrackerDirectory,
};
