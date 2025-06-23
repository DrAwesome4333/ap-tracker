declare enum LocationTrackerType {
    dropdown = "dropdown",
}

declare enum ItemTrackerType {
    group = "group",
}

declare enum ResourceType {
    locationTracker = "location_tracker",
    itemTracker = "item_tracker",
}

declare enum ResourceLocationType {
    local = 1,
    remote = 2,
    builtIn = 3,
}

type BaseResourceManifest = {
    uuid: string;
    name: string;
    version: string;
    description?: string;
    resourceLocationType?: ResourceLocationType;
};

type ResourceManifest = LocationTrackerManifest | ItemTrackerManifest;

type Resource = LocationTracker | ItemTracker;

interface ResourceRepository {
    /** A list of resource manifests available from this tracker */
    resources: ResourceManifest[];
    /** Returns a callback that takes a listener as a parameter and returns a clean up call */
    getUpdateSubscriber: (
        types?: ResourceType[]
    ) => (listener: () => void) => () => void;
    /** Retrieves a resource for a given uuid */
    loadResource: (uuid: string) => Promise<Resource>;
    /** Does any initialization that may be needed such as fetching from a remote server, returns true on success, else false */
    initialize: () => Promise<boolean>;
}
