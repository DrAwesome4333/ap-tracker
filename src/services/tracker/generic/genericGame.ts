import { InventoryManager } from "../../inventory/inventoryManager";
import { LocationManager } from "../../locations/locationManager";
import { Tracker, TrackerBuilder } from "../TrackerManager";
import { CustomCategory_V1 } from "../customTrackerManager";
import { GenericGameMethod } from "./genericGameEnums";
import LocationGroupCategoryGenerator from "./locationTrackerGenerators/locationGroup";
import locationNameGroupGenerator, {
    NameTokenizationOptions,
} from "./locationTrackerGenerators/locationName";

/** Builds a generic tracker for a given game */
const buildGenericGame = (
    gameName: string,
    locationManager: LocationManager,
    inventoryManager: InventoryManager,
    groups: {
        item: { [name: string]: string[] };
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
): Tracker => {
    let locations = locationManager.getMatchingLocations(
        LocationManager.filters.exist
    );
    if (parameters.useAllChecksInDataPackage ?? true) {
        locations = new Set(groups.location["Everywhere"]);
    }
    const { groupConfig, categoryConfig } =
        method === GenericGameMethod.locationGroup
            ? LocationGroupCategoryGenerator.generateCategories(groups.location)
            : locationNameGroupGenerator.generateCategories(
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

    const id = crypto.randomUUID();
    const discriminator = id.substring(0, 8);
    const exportTracker = (): CustomCategory_V1 => {
        return {
            id,
            name: `${gameName} - ${method === GenericGameMethod.locationGroup ? "Location Grouped" : "Name Grouped"} Tracker (${discriminator})`,
            game: gameName,
            customTrackerVersion: 1,
            groupData: groupConfig,
            sectionData: categoryConfig,
        };
    };

    const buildTracker: TrackerBuilder = async ({
        groupManager,
        sectionManager,
    }) => {
        // configure groups and sections
        groupManager.loadGroups(groupConfig);
        sectionManager.setConfiguration(categoryConfig);
        inventoryManager.setItemGroups(groups.item);
    };

    return {
        name: `${gameName} - auto generated`,
        id,
        gameName: gameName,
        buildTracker,
        exportTracker,
    };
};

export { buildGenericGame };
