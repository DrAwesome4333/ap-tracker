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
    return (
        <select
            className="interactive"
            value={currentSelection?.uuid ?? ""}
            onChange={(e) => {
                try {
                    if (e.target.value) {
                        // const trackerChoices = globalOptionManager.getOptionValue("TrackerChoices", "global") as TrackerChoiceOptions;
                        // const newChoices: TrackerChoiceOptions = {
                        //     ...trackerChoices,
                        //     [game]: {
                        //         locationTracker: {
                        //             uuid: e.target.value,
                        //             version: trackers.filter(manifest => manifest.uuid === e.target.value)[0].version
                        //         },
                        //         itemTracker: trackerChoices[game]?.itemTracker,
                        //     }
                        // }
                        // globalOptionManager.setOptionValue("TrackerChoices", "global", newChoices)
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
                    <option key={tracker.uuid} value={tracker.uuid}>
                        {tracker.name}
                    </option>
                );
            })}
        </select>
    );
};

export default TrackerDropdown;
