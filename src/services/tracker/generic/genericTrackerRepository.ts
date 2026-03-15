import { LocationManager } from "../../locations/locationManager";
import { ResourceType } from "../resourceEnums";
import GenericLocationTracker from "./GenericLocationTracker";
import GenericItemTracker from "./GenericItemTracker";
import { OptionManager } from "../../options/optionManager";
import { ResourceManifest, ResourceRepository } from "../resource";
import { GamePackageWrapper } from "../../gamepackage/GamePackageWrapper";

const genericGameRepositoryUuid = "22b6c601-6f35-4264-b90e-1c83389c4a86";

class GenericTrackerRepository implements ResourceRepository {
    static readonly uuid = genericGameRepositoryUuid;
    readonly uuid = GenericTrackerRepository.uuid;
    resources: ResourceManifest[] = [];
    #listeners: Set<{ listener: () => void; types: ResourceType[] }> =
        new Set();
    #locationTracker: GenericLocationTracker;
    #itemTracker: GenericItemTracker;

    constructor(optionManager: OptionManager) {
        this.#locationTracker = new GenericLocationTracker();
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

    configureGenericTrackers = (gamePackage: GamePackageWrapper) => {
        this.#locationTracker.configure(gamePackage);
        this.#itemTracker.configure(gamePackage);
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
