/**  Represents the status of a location in a session */
interface LocationStatus {
    exists: boolean;
    ignored: boolean;
    checked: boolean;
    id: number;
    displayName?: string;
}

/** Represents an update to a {@link LocationStatus} */
interface LocationStatusUpdate {
    exists?: boolean;
    ignored?: boolean;
    checked?: boolean;
    id?: number;
    displayName?: string;
}

/** The default {@link LocationStatus} of a location */
const defaultCheckStatus: LocationStatus = {
    exists: false,
    ignored: false,
    checked: false,
    id: 0,
};
Object.freeze(defaultCheckStatus);
/**
 * Class for managing and broadcasting the state of locations
 */
class LocationManager {
    #locationStatsCache: Map<string, LocationStatus> = new Map();
    #locationStatsModifiers: Map<
        string,
        { sourceId: string; update: LocationStatusUpdate }[]
    > = new Map();
    #sourcePriorities: Map<string, number> = new Map();
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
        sourceId: string,
        locationName: string,
        update: LocationStatusUpdate,
        cleanSlateFromSource?: boolean
    ): void => {
        //check for status related to source id, if not add a new one

        const statusModifiers =
            this.#locationStatsModifiers.get(locationName) ?? [];
        let statusIndex = statusModifiers.findIndex(
            (modifier) => modifier.sourceId === sourceId
        );
        if (statusIndex === -1) {
            const statusPriority = this.#sourcePriorities.get(sourceId) ?? 0;
            statusIndex = 0;
            while (
                statusIndex < statusModifiers.length &&
                this.#sourcePriorities.get(
                    statusModifiers[statusIndex].sourceId
                ) <= statusPriority
            ) {
                statusIndex++;
            }
            statusModifiers.splice(statusIndex, 0, { sourceId, update });
        }

        if (cleanSlateFromSource) {
            statusModifiers[statusIndex].update = update;
        } else {
            statusModifiers[statusIndex].update = {
                ...statusModifiers[statusIndex].update,
                ...update,
            };
        }

        this.#locationStatsModifiers.set(locationName, statusModifiers);
        const newStatus: LocationStatus = statusModifiers.reduce(
            (prev, curr) => ({
                ...prev,
                ...curr.update,
            }),
            defaultCheckStatus
        );

        // make the object immutable
        Object.freeze(newStatus);
        this.#locationStatsCache.set(locationName, newStatus);
        this.#broadcastUpdate(locationName);
    };

    /**
     * Gets the status of a location
     * @param locationName The name of the location to get the status of
     * @returns An immutable {@link LocationStatus } object, returns a default status if location does not yet exist.
     */
    getLocationStatus = (locationName: string): LocationStatus => {
        return this.#locationStatsCache.get(locationName) ?? defaultCheckStatus;
    };

    /**
     * Deletes a location status
     * @param locationName The name of the location to delete
     */
    deleteLocation = (locationName: string) => {
        this.#locationStatsCache.delete(locationName);
        this.#locationStatsModifiers.delete(locationName);
        this.#broadcastUpdate(locationName);
    };

    /**
     * Deletes the status of all locations
     * Resumes update broadcast if paused.
     */
    deleteAllLocations = () => {
        this.pauseUpdateBroadcast();
        const names = [...this.#locationStatsCache.keys()];
        this.#locationStatsCache.clear();
        this.#locationStatsModifiers.clear();
        names.forEach((name) => this.#broadcastUpdate(name));
        this.resumeUpdateBroadcast();
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
        this.#locationStatsCache.forEach((status, checkName) => {
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
     *
     * @param sourceId
     * @param priority Higher number means it will take precedence over lower priorities
     */
    registerSourcePriority = (sourceId: string, priority: number) => {
        if (
            this.#sourcePriorities.has(sourceId) &&
            this.#sourcePriorities.get(sourceId) !== priority
        ) {
            throw new Error(
                "Location Source Priority Error: Cannot change priority, must remove source first."
            );
        }
        this.#sourcePriorities.set(sourceId, priority);
    };

    /**
     * Removes a source's updates from the modifiers for a location
     * Note this will resume update broadcasts.
     * @param sourceId The source to remove
     */
    removeSource = (sourceId: string) => {
        this.pauseUpdateBroadcast();
        const allModifiers = [...this.#locationStatsModifiers.entries()];
        allModifiers.forEach(([locationName, modifiers]) => {
            const newModifiers = modifiers.filter(
                (x) => x.sourceId !== sourceId
            );
            const newStatus: LocationStatus = newModifiers.reduce(
                (prev, curr) => ({
                    ...prev,
                    ...curr.update,
                }),
                defaultCheckStatus
            );
            Object.freeze(newStatus);
            this.#locationStatsModifiers.set(locationName, newModifiers);
            this.#locationStatsCache.set(locationName, newStatus);
            this.#broadcastUpdate(locationName);
        });
        this.#sourcePriorities.delete(sourceId);
        this.resumeUpdateBroadcast();
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
