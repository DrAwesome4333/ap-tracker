import {
    LocationId,
    LocationSource,
    LocationStatus,
    LocationUpdateCallback,
} from "./locationSource";

class LocationRepository {
    #locations: Map<number, LocationStatus> = new Map();
    #listenerCallbacks: Map<
        Set<LocationId>,
        (locations: LocationStatus[]) => void
    > = new Map();
    #sourceCleanupCallbacks: WeakMap<LocationSource, () => void> =
        new WeakMap();
    #locationCache: LocationStatus[] = null;

    #callListeners = (locations: Set<LocationId>) => {
        this.#listenerCallbacks.entries().forEach(([triggerIds, callback]) => {
            let matchedLocations = triggerIds.intersection(locations);
            if (matchedLocations.size > 0) {
                const updates = [...matchedLocations.values()]
                    .map((id) => this.#locations.get(id))
                    .filter((x) => x);
                callback(updates);
            }
        });
    };

    locationUpdateHook = (
        locationIds: LocationId | LocationId[],
        callback: (locations: LocationStatus[]) => void
    ) => {
        const locations = Array.isArray(locationIds)
            ? new Set(locationIds)
            : new Set([locationIds]);
        this.#listenerCallbacks.set(locations, callback);
        callback(
            [...this.#locations.values()].filter((status) =>
                locations.has(status.locationId)
            )
        );
        return () => {
            this.#listenerCallbacks.delete(locations);
        };
    };

    getAllLocations = () => {
        if (this.#locationCache === null) {
            this.#locationCache = [...this.#locations.values()];
            Object.freeze(this.#locationCache);
        }
        return this.#locationCache;
    };

    getLocation = (id: LocationId) => {
        return this.#locations.get(id) ?? null;
    };

    getLocations = (ids: LocationId[]) => {
        const result = ids.map((x) => this.getLocation(x)).filter((x) => x);
        return result;
    };

    addSource = (source: LocationSource) => {
        const sourceUpdateCallback: LocationUpdateCallback = (locations) => {
            const updatedIds: Set<LocationId> = new Set();
            locations.forEach((locationStatus) => {
                updatedIds.add(locationStatus.locationId);
                const newStatus = {
                    name: "",
                    checked: false,
                    ignored: false,
                    ...(this.#locations.get(locationStatus.locationId) ?? {}),
                    ...locationStatus,
                };
                Object.freeze(newStatus);
                this.#locations.set(locationStatus.locationId, newStatus);
            });
            this.#locationCache = null;
            this.#callListeners(updatedIds);
        };
        const cleanupCallback = source.locationUpdateHook(sourceUpdateCallback);
        this.#sourceCleanupCallbacks.set(source, cleanupCallback);
    };

    // Removes listeners only, does not remove objects created by source
    cleanUpSource = (source: LocationSource) => {
        this.#sourceCleanupCallbacks.get(source)?.();
        this.#sourceCleanupCallbacks.delete(source);
    };
}

export default LocationRepository;
