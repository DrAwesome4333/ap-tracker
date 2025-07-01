import { createContext } from "react";
import { InventoryManager } from "../services/inventory/inventoryManager";
import { LocationManager } from "../services/locations/locationManager";
import { EntranceManager } from "../services/entrances/entranceManager";
import { Connector } from "../services/connector/connector";
import { TagManager } from "../services/tags/tagManager";
import { OptionManager } from "../services/options/optionManager";
import TextClientManager from "../services/textClientManager";
import { TrackerManager } from "../services/tracker/TrackerManager";

const ServiceContext: React.Context<{
    locationManager?: LocationManager;
    inventoryManager?: InventoryManager;
    entranceManager?: EntranceManager;
    connector?: Connector;
    tagManager?: TagManager;
    optionManager?: OptionManager;
    trackerManager?: TrackerManager;
    textClientManager?: TextClientManager;
    locationTracker?: LocationTracker;
    inventoryTracker?: ItemTracker;
}> = createContext({});

export default ServiceContext;
