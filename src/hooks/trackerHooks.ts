import { useEffect, useState, useSyncExternalStore } from "react";
import { CustomTrackerRepository } from "../services/tracker/customTrackerRepository";
import {
    TrackerDirectory,
    TrackerManager,
    TrackerResourceId,
} from "../services/tracker/TrackerManager";
import { ResourceType } from "../services/tracker/resourceEnums";

const useTrackerDirectory = (trackerManager: TrackerManager) => {
    const [directory, setDirectory] = useState<TrackerDirectory>(
        trackerManager?.getDirectory() ?? { games: [], trackers: {} }
    );
    useEffect(() => {
        const callback = () => {
            setDirectory(trackerManager.getDirectory());
        };
        const cleanUp = trackerManager?.addDirectoryUpdateCallback(callback);
        return () => {
            cleanUp?.();
        };
    }, [trackerManager]);
    return directory;
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
    const [trackerId, setTrackerId] = useState<TrackerResourceId>(
        trackerManager?.getCurrentGameTracker(game, type) ?? null
    );
    useEffect(() => {
        const callback = () => {
            setTrackerId(trackerManager.getCurrentGameTracker(game, type));
        };
        const cleanUp = trackerManager?.addGameTrackerCallback(game, callback);
        return () => {
            cleanUp?.();
        };
    }, [game, trackerManager, type]);
    return trackerId;
};

export {
    useTrackerDirectory,
    useCurrentGameTracker,
    useCustomTrackerDirectory,
};
