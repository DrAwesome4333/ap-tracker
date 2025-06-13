/**  Represents the status of a location in a session */
interface LocationStatus {
    exists: boolean;
    tags: import("../tags/tagManager").Tag[];
    ignored: boolean;
    checked: boolean;
    id: number;
    displayName?: string;
}

/** Represents an update to a {@link LocationStatus} */
interface LocationStatusUpdate {
    exists?: boolean;
    tags?: import("../tags/tagManager").Tag[];
    ignored?: boolean;
    checked?: boolean;
    id?: number;
    displayName?: string;
}

/** The default {@link LocationStatus} of a location */
const defaultCheckStatus: LocationStatus = {
    exists: false,
    tags: [],
    ignored: false,
    checked: false,
    id: 0,
};
Object.freeze(defaultCheckStatus);

/**
 * Class for managing and broadcasting the state of locations
 */
class LocationManager {
    #locationStats: Map<string, LocationStatus> = new Map();
    #locationSubscribers: Map<Set<string>, (names: Set<string>) => void> =
        new Map();
    #updateQueue: Set<string> = new Set();
    #updatesPaused: boolean = false;

    /**
     * Broadcasts the update to the appropriate listeners if {@link #updatesPaused} is false, else the update is added to the {@link #updateQueue}
     * @param locationName The name of the location update to broadcast
     */
    #broadcastUpdate = (locationName: string): void => {
        if (this.#updatesPaused) {
            this.#updateQueue.add(locationName);
        } else {
            this.#locationSubscribers.forEach((listener, triggerLocations) => {
                if (triggerLocations.has(locationName)) {
                    listener(new Set(locationName));
                }
            });
        }
    };

    /**
     * Prevents update listeners from being called, instead enqueuing them for later.
     * Call {@link resumeUpdateBroadcast} to resume broadcasts and call all queued updates.
     * Use when locations are receiving multiple updates at once
     */
    pauseUpdateBroadcast = () => {
        this.#updatesPaused = true;
    };

    /**
     * Re-enables update listeners being called on updates that were paused with {@link pauseUpdateBroadcast}
     * Will broadcast any queued updates.
     */
    resumeUpdateBroadcast = () => {
        if (this.#updatesPaused) {
            this.#locationSubscribers.forEach((listener, triggerLocations) => {
                if (!triggerLocations.isDisjointFrom(this.#updateQueue)) {
                    listener(this.#updateQueue);
                }
            });
        }
        this.#updatesPaused = false;
        this.#updateQueue.clear();
    };

    /**
     * Updates the status of a location with the provided values
     * Can be used to create location as well
     * @param locationName The name of the location being updated
     * @param status The properties of the status to update
     */
    updateLocationStatus = (
        locationName: string,
        status: LocationStatusUpdate
    ): void => {
        const newStatus: LocationStatus = {
            ...(this.#locationStats.get(locationName) ?? defaultCheckStatus),
            ...status,
        };
        // make the object immutable
        Object.freeze(newStatus);
        this.#locationStats.set(locationName, newStatus);
        this.#broadcastUpdate(locationName);
    };

    /**
     * Gets the status of a location
     * @param locationName The name of the location to get the status of
     * @returns An immutable {@link LocationStatus } object, returns a default status if location does not yet exist.
     */
    getLocationStatus = (locationName: string): LocationStatus => {
        return this.#locationStats.get(locationName) ?? defaultCheckStatus;
    };

    /**
     * Deletes a location status
     * @param locationName The name of the location to delete
     */
    deleteLocation = (locationName: string) => {
        this.#locationStats.delete(locationName);
        this.#broadcastUpdate(locationName);
    };

    /**
     * Deletes the status of all locations
     */
    deleteAllLocations = () => {
        const names = [...this.#locationStats.keys()];
        names.forEach((name) => this.deleteLocation(name));
    };

    /**
     * Gets a list of all known locations that pass a provided filter.
     * @param filter A filter function that accepts a {@link LocationStatus} and returns true if a location should pass the filter else false
     * @returns A set of all location names that passed the filter.
     */
    getMatchingLocations = (
        filter: (status: LocationStatus) => boolean
    ): Set<string> => {
        const locations: Set<string> = new Set();
        this.#locationStats.forEach((status, checkName) => {
            if (filter(status)) {
                locations.add(checkName);
            }
        });
        return locations;
    };

    /**
     * Gets a callback that can be used to subscribe to the listed location(s).
     * @param locationName The check or set of checks to listen to and fire the listener on
     * @returns A callback that accepts the listener as an argument and returns a clean up call. The listener is passed a set of updated locations when called.
     */
    getSubscriberCallback = (locationName: Set<string> | string) => {
        return (listener: (updatedLocations: Set<string>) => void) => {
            let locationNames: Set<string> = null;
            if (typeof locationName === "string") {
                locationNames = new Set([locationName]);
            } else {
                locationNames = locationName;
            }
            this.#locationSubscribers.set(locationNames, listener);
            // return a function to clean up the subscription
            return () => {
                this.#locationSubscribers.delete(locationNames);
            };
        };
    };

    /**
     * Commonly used filters on the {@link getMatchingLocations} method
     */
    static filters = {
        /**
         * Filter for getting locations that exist in the current session.
         * @param status The status of the location
         * @returns True if the status states the location exists else false.
         */
        exist: (status: LocationStatus) => {
            return status.exists;
        },
    };
}

export { LocationManager };
export type { LocationStatus, LocationStatusUpdate };
