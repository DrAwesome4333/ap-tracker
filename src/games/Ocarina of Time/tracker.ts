import { Tracker } from "../TrackerManager";

const tracker: Tracker = {
    name: "Ocarina of Time Demo Tracker",
    gameName: "Ocarina of Time",
    id: "3d0e25d3-636d-4929-aa7d-332c72863175",
    buildTracker: async ({
        sectionManager,
        groupManager,
        locationManager,
        slotData: _slotData,
    }) => {
        // Dynamically load the the backend module, we do not need to load the module if this tracker is not being used
        const data = await import("./loadData").then(
            (module) => module.trackerData
        );
        // slotData by default is unknown, if you know the structure of your slot data, casting it like so can be helpful
        const slotData = _slotData as { tokensanity: 0 | 1 | 2 | 3 };
        // Configure the group and section managers
        groupManager.loadGroups(data.groupData);
        sectionManager.setConfiguration(data.sectionData);
        // Get all locations, and append anything with "GS" with a spider emoji for demo purposes
        if (slotData.tokensanity) {
            locationManager
                .getMatchingLocations(() => true)
                .forEach((locationName) => {
                    locationManager.updateLocationStatus(locationName, {
                        displayName: `${locationName}${locationName.includes("GS") ? " 🕷️ " : ""}`,
                    });
                });
        }
    },
};

export default tracker;
