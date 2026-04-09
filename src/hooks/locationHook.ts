import { useContext, useEffect, useState } from "react";
import SlotContext from "../contexts/slotContext";
import { LocationStatus } from "../services/locations/locationSource";

const useSlotLocations = (trackedLocations: number[]) => {
    const slotContext = useContext(SlotContext);
    const locationRepository = slotContext.locationRepository;
    const [locations, setLocations] = useState<LocationStatus[]>([]);
    useEffect(() => {
        const callback = () => {
            if (trackedLocations) {
                setLocations(locationRepository.getLocations(trackedLocations));
            }
        };
        const cleanUp = locationRepository?.locationUpdateHook(
            trackedLocations,
            callback
        );
        return cleanUp;
    }, [trackedLocations, locationRepository]);

    return locations;
};

export { useSlotLocations };
