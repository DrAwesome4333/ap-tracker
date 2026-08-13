import { GamePackageWrapper } from "../../gamepackage/GamePackageWrapper";
import { OptionManager } from "../../options/optionManager";
import CustomItemTracker from "../itemTrackers/CustomItemTracker";
import { CustomItemTrackerDef_V1 } from "../itemTrackers/formatDefinitions/CustomItemTrackerFormat_V1";
import { ItemTrackerType, ResourceType } from "../resourceEnums";

const genericGameItemTrackerUuid = "6481e85a-707e-4095-b741-f821abdd26f7";

class GenericItemTracker extends CustomItemTracker {
    readonly uuid = genericGameItemTrackerUuid;
    static readonly uuid = genericGameItemTrackerUuid;
    constructor(optionManager: OptionManager, gamePackage: GamePackageWrapper) {
        const groupsUpdated = { ...gamePackage.getItemGroups() };
        delete groupsUpdated["Everything"];
        const itemGroupDef: CustomItemTrackerDef_V1 = {
            manifest: {
                type: ResourceType.itemTracker,
                itemTrackerType: ItemTrackerType.group,
                uuid: GenericItemTracker.uuid,
                name: "Generic Item Tracker",
                formatVersion: 1,
                version: "0.0.0",
                game: null,
            },
            groups: groupsUpdated,
        };
        super(optionManager, itemGroupDef, {
            discriminator: `-${gamePackage.game}`,
        });
    }
}

export default GenericItemTracker;
