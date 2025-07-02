import { useSyncExternalStore } from "react";
import { LocationManager } from "../services/locations/locationManager";

const useSection = (tracker: DropdownLocationTracker, name: string) => {
    const callback = tracker
        ? tracker.getUpdateSubscriber(name)
        : (_: () => void) => {
              /* There is nothing to listen to*/ return () => {
                  /* Empty clean up call */
              };
          };
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
