import { LocationId } from "../locations/locationSource";

type ItemId = number;
interface Item {
    itemId: ItemId;
    name: string;
    index: number;
    locationId: LocationId;
    senderSlot: number;
    location: string;
    sender: string;
    flags: {
        progression: boolean;
        useful: boolean;
        trap: boolean;
        local: boolean;
        server: boolean;
    };
}

type ItemUpdateCallback = (items: Item[]) => void;

interface ItemSource {
    itemUpdateHook: (callback: ItemUpdateCallback) => () => void;
}

export type { ItemId, Item, ItemSource, ItemUpdateCallback };
