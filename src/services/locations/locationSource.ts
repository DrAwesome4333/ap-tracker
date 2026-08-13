type LocationId = number;
type LocationStatus = {
    locationId: LocationId;
    name: string;
    checked: boolean;
    ignored: boolean;
};
type LocationStatusUpdate = Partial<LocationStatus> & {
    locationId: LocationId;
};
type LocationUpdateCallback = (locations: LocationStatusUpdate[]) => void;

interface LocationSource {
    locationUpdateHook: (callback: LocationUpdateCallback) => () => void;
}

export type {
    LocationUpdateCallback,
    LocationId,
    LocationStatus,
    LocationSource,
    LocationStatusUpdate,
};
