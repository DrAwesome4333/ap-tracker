import { useSyncExternalStore } from "react";
import { LocationManager } from "../services/locations/locationManager";

const useSection = (tracker: DropdownLocationTracker, name: string) => {
    return useSyncExternalStore(
        tracker?.getUpdateSubscriber(name),
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
