type ItemTrackerManifest = {
    type: ResourceType.itemTracker;
    game: string;
    compatibleDataPackages?: string[];
} & BaseResourceManifest;

/** Values that have changed since the last update*/
interface ItemTrackerUpdatePack {
    options?: { [optionName: string]: JSONValue };
    slotData?: unknown;
    itemGroups?: { [groupName: string]: string[] };
}

interface BaseItemTracker {
    readonly manifest: ItemTrackerManifest;
    readonly options: { [optionName: string]: Option };
    getUpdateSubscriber: () => (listener: () => void) => () => void;
    update?: (updates: ItemTrackerUpdatePack) => void;
    reset?: () => void;
}

type GroupItemTracker = {
    readonly type: ItemTrackerType.group;
    getGroup: (name: string) => unknown;
    exportGroups: () => unknown;
} & BaseItemTracker;

type ItemTracker = GroupItemTracker;
