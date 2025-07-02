import { useSyncExternalStore } from "react";
import { CustomTrackerRepository } from "../services/tracker/customTrackerManager";
import { TrackerManager } from "../services/tracker/TrackerManager";
import { ResourceType } from "../services/tracker/resourceEnums";

const useTrackerDirectory = (trackerManager: TrackerManager) => {
    return useSyncExternalStore(
        trackerManager.getDirectorySubscriberCallback(),
        trackerManager.getDirectory,
        trackerManager.getDirectory
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
    return useSyncExternalStore(
        trackerManager.getTrackerSubscriberCallback(),
        () => trackerManager.getCurrentGameTracker(game, type),
        () => trackerManager.getCurrentGameTracker(game, type)
    );
};

export {
    useTrackerDirectory,
    useCurrentGameTracker,
    useCustomTrackerDirectory,
};
