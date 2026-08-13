import {
    ItemTrackerType,
    LocationTrackerType,
    ResourceType,
} from "../resourceEnums";
import GenericLocationTracker from "./GenericLocationTracker";
import GenericItemTracker from "./GenericItemTracker";
import { OptionManager } from "../../options/optionManager";
import { ResourceManifest, ResourceRepository } from "../resource";
import { GamePackageWrapper } from "../../gamepackage/GamePackageWrapper";

const genericGameRepositoryUuid = "22b6c601-6f35-4264-b90e-1c83389c4a86";

class GenericTrackerRepository implements ResourceRepository {
    static readonly uuid = genericGameRepositoryUuid;
    readonly uuid = GenericTrackerRepository.uuid;
    resources: ResourceManifest[] = [
        {
            type: ResourceType.itemTracker,
            itemTrackerType: ItemTrackerType.group,
            uuid: GenericItemTracker.uuid,
            name: "Generic Item Tracker",
            formatVersion: 1,
            version: "0.0.0",
            game: null,
        },
        {
            type: ResourceType.locationTracker,
            locationTrackerType: LocationTrackerType.dropdown,
            uuid: GenericLocationTracker.uuid,
            name: "Generic Location Tracker",
            formatVersion: 2,
            version: "0.0.0",
            game: null,
        },
    ];
    #listeners: Set<{ listener: () => void; types: ResourceType[] }> =
        new Set();
    #optionManager: OptionManager;

    constructor(optionManager: OptionManager) {
        this.#optionManager = optionManager;
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

    loadResource = async (
        uuid: string,
        _version: string,
        _type: string,
        gamePackage: GamePackageWrapper
    ) => {
        switch (uuid) {
            case GenericLocationTracker.uuid:
                return new GenericLocationTracker(gamePackage);
            case GenericItemTracker.uuid:
                return new GenericItemTracker(this.#optionManager, gamePackage);
        }
        return null;
    };

    /** There is nothing to initialize here */
    initialize = async () => {
        return true;
    };
}

export default GenericTrackerRepository;
