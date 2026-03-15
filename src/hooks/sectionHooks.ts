import { useContext, useEffect, useState, useSyncExternalStore } from "react";
import { LocationTrackerType } from "../services/tracker/resourceEnums";
import { DropdownLocationTracker } from "../services/tracker/locationTrackers/locationTrackers";
import emptySyncCallback from "./emptyCallback";
import SlotContext from "../contexts/slotContext";
import {
    LocationId,
    LocationStatus,
    LocationUpdateCallback,
} from "../services/locations/locationSource";

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

const useLocationStatus = (locationId: LocationId) => {
    const slotContext = useContext(SlotContext);
    const locationRepository = slotContext.locationRepository;
    const [locationStatus, setLocationStatus] = useState<LocationStatus>(
        locationRepository?.getLocation(locationId) ?? null
    );
    useEffect(() => {
        const callback: LocationUpdateCallback = (locationUpdates) => {
            if (locationUpdates[0]) {
                setLocationStatus((old) =>
                    old
                        ? { ...old, ...locationUpdates[0] }
                        : {
                              checked: false,
                              ignored: false,
                              name: "",
                              ...locationUpdates[0],
                          }
                );
            }
        };
        const cleanUp = locationRepository.locationUpdateHook(
            locationId,
            callback
        );
        return cleanUp;
    }, []);
    return locationStatus;
};

export { useSection, useLocationStatus };
