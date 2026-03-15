import { createContext } from "react";
import { ItemTracker } from "../services/tracker/itemTrackers/itemTrackers";
import { LocationTracker } from "../services/tracker/locationTrackers/locationTrackers";
import { TagManager } from "../services/tags/tagManager";
import LocationRepository from "../services/locations/locationRepository";
import ItemRepository from "../services/items/itemRepository";

const SlotContext: React.Context<{
    slotName?: string;
    slotAlias?: string;
    locationRepository?: LocationRepository;
    itemRepository?: ItemRepository;
    itemTracker?: ItemTracker;
    locationTracker?: LocationTracker;
    tagManager?: TagManager;
}> = createContext({});

export default SlotContext;
