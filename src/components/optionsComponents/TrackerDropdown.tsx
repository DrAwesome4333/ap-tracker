import React, { useMemo } from "react";
import {
    useCurrentGameTracker,
    useTrackerDirectory,
} from "../../hooks/trackerHooks";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import TrackerManager from "../../services/tracker/TrackerManager";
import { naturalSort } from "../../utility/comparisons";
/**
 * Displays a drop down with a list of options available for trackers for the provided game name
 * @param param0
 * @returns
 */
const TrackerDropdown = ({
    game,
    trackerManager,
}: {
    game: string;
    trackerManager: TrackerManager;
}) => {
    const directory = useTrackerDirectory();
    const currentSelection = useCurrentGameTracker(game, trackerManager);
    const trackers = useMemo(() => {
        const list = directory.trackers.filter(
            (tracker) => tracker.gameName === game
        );
        list.sort((a, b) => naturalSort(a.name, b.name));
        return list;
    }, [directory.trackers]);
    return (
        <select
            className="interactive"
            value={currentSelection?.id ?? ""}
            onChange={(e) => {
                try {
                    if (e.target.value) {
                        trackerManager.setGameTracker(
                            game,
                            e.target.value,
                            true
                        );
                    } else {
                        trackerManager.setGameTracker(game, null, true);
                    }
                } catch (e) {
                    console.error(e);
                    NotificationManager.createToast({
                        message: "An error occurred",
                        type: MessageType.error,
                        details: e.toString(),
                        duration: 10,
                    });
                }
            }}
        >
            <option value="">Default</option>
            {trackers.map((tracker) => {
                return (
                    <option key={tracker.id} value={tracker.id}>
                        {tracker.name}
                    </option>
                );
            })}
        </select>
    );
};

export default TrackerDropdown;
