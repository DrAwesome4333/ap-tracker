import { GamePackageWrapper } from "../../gamepackage/GamePackageWrapper";
import CustomLocationTracker from "../locationTrackers/CustomLocationTracker";
import LocationGroupCategoryGenerator from "./locationTrackerGenerators/locationGroup";

const genericGameLocationTrackerUuid = "2b1690e1-006f-48d0-9b2d-df8bb3f89338";

class GenericLocationTracker extends CustomLocationTracker {
    readonly uuid = genericGameLocationTrackerUuid;
    static readonly uuid = genericGameLocationTrackerUuid;
    constructor(gamePackage: GamePackageWrapper) {
        const sectionDef = LocationGroupCategoryGenerator.generateSectionDef(
            gamePackage.getLocationGroups()
        );
        sectionDef.manifest.uuid = GenericLocationTracker.uuid;
        super(gamePackage, sectionDef);
        this.manifest.uuid = GenericLocationTracker.uuid;
        this.manifest.name = "Generic Dropdown Tracker";
    }
}

export default GenericLocationTracker;
