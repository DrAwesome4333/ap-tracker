type LocationTrackerManifest = {
    type: ResourceType.locationTracker;
    locationTrackerType: LocationTrackerType;
    game: string;
    compatibleDataPackages?: string[];
    formatVersion: number;
} & BaseResourceManifest;

/** Values that have changed since the last update*/
interface LocationTrackerUpdatePack {
    options?: { [optionName: string]: JSONValue };
    slotData?: unknown;
    locationGroups?: { [groupName: string]: string[] };
}

interface BaseLocationTracker {
    readonly manifest: LocationTrackerManifest;
    readonly options?: { [optionName: string]: Option };
    getUpdateSubscriber: () => (listener: () => void) => () => void;
    update?: (updates: LocationTrackerUpdatePack) => void;
    reset?: () => void;
}

type DropdownLocationTracker = {
    readonly type: LocationTrackerType.dropdown;
    getSection: (name: string) => unknown;
    exportDropdowns: () => unknown;
} & BaseLocationTracker;

type LocationTracker = DropdownLocationTracker;
