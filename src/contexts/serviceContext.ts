import { createContext } from "react";
import { InventoryManager } from "../services/inventory/inventoryManager";
import { LocationManager } from "../services/locations/locationManager";
import { Connector } from "../services/connector/connector";
import { TagManager } from "../services/tags/tagManager";
import { OptionManager } from "../services/options/optionManager";
import TextClientManager from "../services/textClientManager";
import { TrackerManager } from "../services/tracker/TrackerManager";
import { CustomTrackerRepository } from "../services/tracker/customTrackerRepository";
import { LocationTracker } from "../services/tracker/locationTrackers/locationTrackers";
import { ItemTracker } from "../services/tracker/itemTrackers/itemTrackers";
import GenericTrackerRepository from "../services/tracker/generic/genericTrackerRepository";
import { LocationTagger } from "../services/tags/LocationTagger";
import HintTagger from "../services/tags/HintTagger";
import HintManager from "../services/HintManager";

const ServiceContext: React.Context<{
    locationManager?: LocationManager;
    inventoryManager?: InventoryManager;
    connector?: Connector;
    tagManager?: TagManager;
    optionManager?: OptionManager;
    trackerManager?: TrackerManager;
    textClientManager?: TextClientManager;
    locationTracker?: LocationTracker;
    inventoryTracker?: ItemTracker;
    customTrackerRepository?: CustomTrackerRepository;
    genericTrackerRepository?: GenericTrackerRepository;
    locationTagger?: LocationTagger;
    hintTagger?: HintTagger;
    hintManager?: HintManager;
}> = createContext({});

export default ServiceContext;
