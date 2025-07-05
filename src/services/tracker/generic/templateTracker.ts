import { LocationManager } from "../../locations/locationManager";
import CustomLocationTracker from "../locationTrackers/CustomLocationTracker";
import { GenericGameMethod } from "./genericGameEnums";
import LocationGroupCategoryGenerator from "./locationTrackerGenerators/locationGroup";
import LocationNameCategoryGenerator, {
    NameTokenizationOptions,
} from "./locationTrackerGenerators/locationName";

const genericGameTemplateTrackerUuid = "68b69e1c-41ac-4edb-9c50-0b11f03c027e";

class TemplateLocationTracker extends CustomLocationTracker {
    readonly uuid = genericGameTemplateTrackerUuid;
    static readonly uuid = genericGameTemplateTrackerUuid;
    #locationManager: LocationManager;
    constructor(locationManager: LocationManager) {
        super(locationManager);
        this.#locationManager = locationManager;
        this.manifest.uuid = TemplateLocationTracker.uuid;
        this.manifest.name = "Template Dropdown Tracker";
        this.manifest.game = "Template";
    }

    #reset = () => {
        this.sections.clear();
        this.cleanupCalls.forEach((callback) => callback());
        this.callListeners();
    };

    configure = (
        groups: { location: { [name: string]: string[] } },
        method: GenericGameMethod,
        params?: {
            tokenOptions: NameTokenizationOptions;
            groupRequirements: {
                minGroupSize: number;
                maxDepth: number;
                minTokenCount: number;
            };
        }
    ) => {
        this.#reset();
        const sectionDef =
            method === GenericGameMethod.locationGroup
                ? LocationGroupCategoryGenerator.generateSectionDef(
                      groups.location
                  )
                : LocationNameCategoryGenerator.generateSectionDef(
                      this.#locationManager.getMatchingLocations(() => true),
                      params.tokenOptions,
                      params.groupRequirements
                  );
        sectionDef.manifest.uuid = TemplateLocationTracker.uuid;
        this.read(sectionDef);
    };
}

export default TemplateLocationTracker;
