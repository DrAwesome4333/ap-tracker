import { InventoryItem } from "../../inventory/inventoryManager";
import { TrackerOption } from "../../options/option";
import { ResourceType, ItemTrackerType } from "../resourceEnums";
import { CustomItemTrackerDef_V1 } from "./formatDefinitions/CustomItemTrackerFormat_V1";
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
    newItems?: InventoryItem[];
}

interface BaseItemTracker {
    readonly manifest: ItemTrackerManifest;
    readonly options: { [optionName: string]: TrackerOption };
    getUpdateSubscriber: () => (listener: () => void) => () => void;
    update?: (updates: ItemTrackerUpdatePack) => void;
    reset?: () => void;
    getOptionSubscriber: () => (listener: () => void) => () => void;
}

type ItemCollectionDef = {
    /** The display name of the collection */
    name: string;
    /** Accepted Item ids */
    allowedItems: Set<string | number>;
};

type GroupItemTracker = {
    readonly type: ItemTrackerType.group;
    getGroups: () => ItemCollectionDef[];
    exportGroups: () => CustomItemTrackerDef_V1;
} & BaseItemTracker;

type ItemTracker = GroupItemTracker;
