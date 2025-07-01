import React, { useContext } from "react";
import { useTrackerDirectory } from "../../hooks/trackerHooks";
import TrackerDropdown from "./TrackerDropdown";
import { tertiary } from "../../constants/colors";
import ServiceContext from "../../contexts/serviceContext";

/**
 * A UI for selecting which tracker to use with which game
 */
const TrackerPicker = () => {
    const services = useContext(ServiceContext);
    const trackerManager = services.trackerManager;
    const trackerDirectory = useTrackerDirectory(trackerManager);

    return (
        <div>
            <div>
                <p>Select which tracker to use for different games</p>
                {trackerDirectory.games.length > 0 ? (
                    trackerDirectory.games.map((game) => {
                        return (
                            <div key={game}>
                                {game}:{" "}
                                <TrackerDropdown
                                    game={game}
                                    trackerManager={trackerManager}
                                />
                            </div>
                        );
                    })
                ) : (
                    <i style={{ color: tertiary }}>
                        No options available, add some custom trackers to have
                        options.
                    </i>
                )}
            </div>
        </div>
    );
};

export default TrackerPicker;
