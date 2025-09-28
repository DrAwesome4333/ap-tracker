import { useSyncExternalStore } from "react";
import { LocationManager } from "../services/locations/locationManager";
import { LocationTrackerType } from "../services/tracker/resourceEnums";
import { DropdownLocationTracker } from "../services/tracker/locationTrackers/locationTrackers";
import emptySyncCallback from "./emptyCallback";

const useSection = (tracker: DropdownLocationTracker, name: string) => {
    const callback =
        tracker &&
        tracker.manifest.locationTrackerType === LocationTrackerType.dropdown
            ? tracker.getUpdateSubscriber(name)
            : emptySyncCallback;
    return useSyncExternalStore(
        callback,
        () => tracker?.getSection(name),
        () => tracker?.getSection(name)
    );
};

const useLocationStatus = (
    locationManager: LocationManager,
    location: string
) => {
    return useSyncExternalStore(
        locationManager.getSubscriberCallback(location),
        () => locationManager.getLocationStatus(location),
        () => locationManager.getLocationStatus(location)
    );
};

export { useSection, useLocationStatus };
