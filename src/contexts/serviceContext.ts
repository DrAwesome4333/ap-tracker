import { createContext } from "react";
import { InventoryManager } from "../services/inventory/inventoryManager";
import { LocationManager } from "../services/locations/locationManager";
import { GroupManager } from "../services/sections/groupManager";
import { EntranceManager } from "../services/entrances/entranceManager";
import { Connector } from "../services/connector/connector";
import { SectionManager } from "../services/sections/sectionManager";
import { TagManager } from "../services/tags/tagManager";
import { OptionManager } from "../services/options/optionManager";
import TextClientManager from "../services/textClientManager";
import TrackerManager from "../services/tracker/TrackerManager";

const ServiceContext: React.Context<{
    locationManager?: LocationManager;
    inventoryManager?: InventoryManager;
    groupManager?: GroupManager;
    entranceManager?: EntranceManager;
    connector?: Connector;
    sectionManager?: SectionManager;
    tagManager?: TagManager;
    optionManager?: OptionManager;
    trackerManager?: TrackerManager;
    textClientManager?: TextClientManager;
}> = createContext({});

export default ServiceContext;
