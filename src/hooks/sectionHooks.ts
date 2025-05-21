import { useSyncExternalStore } from "react";
import { SectionManager } from "../services/sections/sectionManager";
import { LocationManager } from "../services/locations/locationManager";

const useSection = (sectionManager: SectionManager, name: string) => {
    return useSyncExternalStore(
        sectionManager.getSubscriberCallback(name),
        () => sectionManager.getSectionStatus(name),
        () => sectionManager.getSectionStatus(name)
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
