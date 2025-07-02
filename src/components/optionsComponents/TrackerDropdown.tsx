import React, { useMemo, useContext } from "react";
import {
    useCurrentGameTracker,
    useTrackerDirectory,
} from "../../hooks/trackerHooks";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import ServiceContext from "../../contexts/serviceContext";
import { naturalSort } from "../../utility/comparisons";
import { ResourceType } from "../../services/tracker/resourceEnums";
import { TrackerResourceId } from "../../services/tracker/TrackerManager";
/**
 * Displays a drop down with a list of options available for trackers for the provided game name
 * @param param0
 * @returns
 */
const TrackerDropdown = ({ game }: { game: string }) => {
    const services = useContext(ServiceContext);
    const trackerManager = services.trackerManager;
    const directory = useTrackerDirectory(trackerManager);
    const currentSelection = useCurrentGameTracker(
        game,
        trackerManager,
        ResourceType.locationTracker
    );
    const trackers = useMemo(() => {
        const list = directory.trackers[ResourceType.locationTracker].filter(
            (tracker) => tracker.game === game
        );
        list.sort((a, b) => naturalSort(a.name, b.name));
        return list;
    }, [directory.trackers[ResourceType.locationTracker]]);

    const getTrackerKey = (tracker: TrackerResourceId) => {
        return tracker
            ? `${tracker.uuid}-${tracker.version}-${tracker.type}`
            : null;
    };

    const trackerLookupTable = {};
    trackers.forEach(
        (tracker) => (trackerLookupTable[getTrackerKey(tracker)] = tracker)
    );
    return (
        <select
            className="interactive"
            value={getTrackerKey(currentSelection) ?? ""}
            disabled={trackers.length < (game ? 1 : 2)} // If game is defined, there is the default
            onChange={(e) => {
                try {
                    if (e.target.value) {
                        const tracker = trackerLookupTable[e.target.value];
                        trackerManager.setGameTracker(game, tracker);
                    } else {
                        trackerManager.setGameTracker(game, {
                            type: ResourceType.locationTracker,
                        });
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
            {game && <option value="">Default</option>}
            {trackers.map((tracker) => {
                return (
                    <option
                        key={getTrackerKey(tracker)}
                        value={getTrackerKey(tracker)}
                    >
                        {tracker.name}
                    </option>
                );
            })}
        </select>
    );
};

export default TrackerDropdown;
