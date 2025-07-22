import { LocationManager } from "../../locations/locationManager";
import { ResourceType } from "../resourceEnums";
import { InventoryManager } from "../../inventory/inventoryManager";
import GenericLocationTracker from "./GenericLocationTracker";
import GenericItemTracker from "./GenericItemTracker";
import { OptionManager } from "../../options/optionManager";

const genericGameRepositoryUuid = "22b6c601-6f35-4264-b90e-1c83389c4a86";
// const genericGameItemTrackerUuid = '46995402-c311-4992-9c35-8bf9a9c8427e';

class GenericTrackerRepository implements ResourceRepository {
    static readonly uuid = genericGameRepositoryUuid;
    readonly uuid = GenericTrackerRepository.uuid;
    resources: ResourceManifest[] = [];
    #listeners: Set<{ listener: () => void; types: ResourceType[] }> =
        new Set();
    #locationTracker: GenericLocationTracker;
    #itemTracker: GenericItemTracker;
    // #locationManager: LocationManager;
    // #inventoryManager: InventoryManager;

    constructor(
        optionManager: OptionManager,
        locationManager: LocationManager,
        _inventoryManager: InventoryManager
    ) {
        // this.#locationManager = locationManager;
        // this.#inventoryManager = inventoryManager;
        this.#locationTracker = new GenericLocationTracker(locationManager);
        this.#itemTracker = new GenericItemTracker(optionManager);
        this.resources = [
            this.#locationTracker.manifest,
            this.#itemTracker.manifest,
        ];
    }

    getUpdateSubscriber = (types?: ResourceType[]) => {
        return (listener: () => void) => {
            const listenerObject = {
                listener,
                types,
            };
            this.#listeners.add(listenerObject);
            return () => this.#listeners.delete(listenerObject);
        };
    };

    #callListeners = (types: ResourceType[]) => {
        const typesSet = new Set(types);
        this.#listeners.forEach((listenerObj) => {
            if (
                !listenerObj.types ||
                !new Set(listenerObj.types).isDisjointFrom(typesSet)
            ) {
                listenerObj.listener();
            }
        });
    };

    configureGenericTrackers = (
        _gameName: string,
        groups: {
            location: { [name: string]: string[] };
            item: { [name: string]: string[] };
        }
    ) => {
        this.#locationTracker.configure(groups);
        this.#itemTracker.configure(groups);
        this.#callListeners([ResourceType.locationTracker]);
        return {
            [ResourceType.locationTracker]: {
                uuid: this.#locationTracker.manifest.uuid,
                version: this.#locationTracker.manifest.version,
                type: ResourceType.locationTracker,
            },
            [ResourceType.itemTracker]: {
                uuid: this.#itemTracker.manifest.uuid,
                version: this.#itemTracker.manifest.version,
                type: ResourceType.locationTracker,
            },
        };
    };

    loadResource = async (uuid: string, _version: string, _type: string) => {
        if (uuid === this.#itemTracker?.manifest.uuid) {
            return this.#itemTracker;
        }
        if (uuid === this.#locationTracker?.manifest.uuid) {
            return this.#locationTracker;
        }
        return null;
    };

    /** There is nothing to initialize here */
    initialize = async () => {
        return true;
    };
}

export default GenericTrackerRepository;
