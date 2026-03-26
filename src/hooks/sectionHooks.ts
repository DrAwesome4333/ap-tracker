import { useContext, useEffect, useState } from "react";
import {
    DropdownLocationTracker,
    Section,
} from "../services/tracker/locationTrackers/locationTrackers";
import SlotContext from "../contexts/slotContext";
import {
    LocationId,
    LocationStatus,
    LocationUpdateCallback,
} from "../services/locations/locationSource";

const useSection = (tracker: DropdownLocationTracker, name: string) => {
    const [section, setSection] = useState<Section>(
        tracker?.getSection?.(name) ?? null
    );
    const [trackedTracker, setTrackedTracker] =
        useState<DropdownLocationTracker>(null);
    if (trackedTracker !== tracker) {
        setTrackedTracker(tracker);
        setSection(tracker?.getSection?.(name) ?? null);
    }

    useEffect(() => {
        const callback = () => {
            setSection(tracker.getSection(name));
        };
        const cleanUp = tracker?.addSectionUpdateCallBack(name, callback);
        return () => {
            cleanUp?.();
        };
    }, [tracker, name]);

    return section;
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
