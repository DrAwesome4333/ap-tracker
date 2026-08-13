import { createContext } from "react";
import { ItemTracker } from "../services/tracker/itemTrackers/itemTrackers";
import { LocationTracker } from "../services/tracker/locationTrackers/locationTrackers";
import { TagManager } from "../services/tags/tagManager";
import LocationRepository from "../services/locations/locationRepository";
import ItemRepository from "../services/items/itemRepository";
import HintManager from "../services/HintManager";
import { LocationTagger } from "../services/tags/LocationTagger";
import { GamePackageWrapper } from "../services/gamepackage/GamePackageWrapper";

type SlotContextData = {
    game?: string;
    slotName?: string;
    slotAlias?: string;
    slotNumber?: number;
    multiWorldId?: string;
    locationRepository?: LocationRepository;
    itemRepository?: ItemRepository;
    itemTracker?: ItemTracker;
    locationTracker?: LocationTracker;
    tagManager?: TagManager;
    hintManager?: HintManager;
    locationTagger?: LocationTagger;
    gamePackage?: GamePackageWrapper;
    liveSlot: boolean;
};

const SlotContext: React.Context<SlotContextData> = createContext({});

export default SlotContext;
export type { SlotContextData };
