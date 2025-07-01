import { randomUUID } from "../../../utility/uuid";
import { LocationManager } from "../../locations/locationManager";
import CustomLocationTracker from "../locationTrackers/CustomLocationTracker";
import { GenericGameMethod } from "./genericGameEnums";
import LocationGroupCategoryGenerator from "./locationTrackerGenerators/locationGroup";
import locationNameGroupGenerator, {
    NameTokenizationOptions,
} from "./locationTrackerGenerators/locationName";
import { ResourceType } from "../resourceEnums";

const genericGameRepositoryUuid = '22b6c601-6f35-4264-b90e-1c83389c4a86';

class GenericGameRepository implements ResourceRepository {
    readonly uuid = genericGameRepositoryUuid;
    resources: ResourceManifest[] = [];
    #listeners: Set<{ listener: () => void, types: ResourceType[] }> = new Set();
    #locationTracker: LocationTracker;
    #itemTracker: ItemTracker;
    getUpdateSubscriber = (types?: ResourceType[]) => {
        return (listener: () => void) => {
            const listenerObject = {
                listener,
                types
            }
            this.#listeners.add(listenerObject);
            return () => this.#listeners.delete(listenerObject);
        }
    }

    #callListeners = (types: ResourceType[]) => {
        const typesSet = new Set(types);
        this.#listeners.forEach((listenerObj) => {
            if (!listenerObj.types || !new Set(listenerObj.types).isDisjointFrom(typesSet)) {
                listenerObj.listener();
            }
        })
    }

    buildGenericTrackers = (
        gameName: string,
        locationManager: LocationManager,
        groups: {
            location: { [name: string]: string[] };
        },
        method: GenericGameMethod = GenericGameMethod.locationGroup,
        parameters: {
            useAllChecksInDataPackage?: boolean;
            tokenizationOptions?: NameTokenizationOptions;
            groupingOptions?: {
                minGroupSize?: number;
                maxDepth?: number;
                minTokenCount?: number;
            };
        } = {}
    ) => {
        let locations = locationManager.getMatchingLocations(
            LocationManager.filters.exist
        );
        if (parameters.useAllChecksInDataPackage ?? true) {
            locations = new Set(groups.location["Everywhere"]);
        }
        const sectionDef =
            method === GenericGameMethod.locationGroup
                ? LocationGroupCategoryGenerator.generateSectionDef(groups.location)
                : locationNameGroupGenerator.generateSectionDef(
                    locations,
                    {
                        splitCharacters: [" ", ".", "_", "-", ":"],
                        splitOnCase: true,
                        ...parameters.tokenizationOptions,
                    },
                    {
                        maxDepth: 3,
                        minGroupSize: 3,
                        minTokenCount: 1,
                        ...parameters.groupingOptions,
                    }
                );

        const id = randomUUID();
        const discriminator = id.substring(0, 8);
        sectionDef.manifest.repositoryUuid = genericGameRepositoryUuid;
        sectionDef.manifest.uuid = id;
        sectionDef.manifest.game = gameName;
        sectionDef.manifest.name = `${gameName} Tracker (${discriminator})`;
        this.#locationTracker = new CustomLocationTracker(sectionDef, locationManager, genericGameRepositoryUuid);
        this.resources = [this.#locationTracker.manifest];
        this.#callListeners([ResourceType.locationTracker]);
        return {
            location: this.#locationTracker.manifest.uuid,
            item: null,//this.#itemTracker.manifest.uuid,
        }
    }

    loadResource = async (uuid: string, _version: string) => {
        if(uuid === this.#itemTracker?.manifest.uuid){
            return this.#itemTracker;
        }
        if(uuid === this.#locationTracker?.manifest.uuid){
            return this.#locationTracker;
        }
        return null;
    }

    /** There is nothing to initialize here */
    initialize = async () => {
        return true;
    }

}

const genericGameRepository = new GenericGameRepository();

export { genericGameRepository };
