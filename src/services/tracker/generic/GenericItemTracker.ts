import { OptionManager } from "../../options/optionManager";
import CustomItemTracker from "../itemTrackers/CustomItemTracker";
import { CustomItemTrackerDef_V1 } from "../itemTrackers/formatDefinitions/CustomItemTrackerFormat_V1";

const genericGameItemTrackerUuid = "6481e85a-707e-4095-b741-f821abdd26f7";

class GenericItemTracker extends CustomItemTracker {
    readonly uuid = genericGameItemTrackerUuid;
    static readonly uuid = genericGameItemTrackerUuid;
    constructor(optionManager: OptionManager) {
        super(optionManager);
        this.manifest.uuid = GenericItemTracker.uuid;
        this.manifest.name = "Generic Item Tracker";
    }

    #reset = () => {
        this.cleanupCalls.forEach((callback) => callback());
        this.callListeners();
    };

    configure = (
        groups: { item: { [name: string]: string[] } },
        gameName: string
    ) => {
        this.#reset();
        this.discriminator = `-${gameName}`;
        const groupsUpdated = { ...groups.item };
        delete groupsUpdated["Everything"];
        const itemGroupDef: CustomItemTrackerDef_V1 = {
            manifest: { ...this.manifest },
            groups: groupsUpdated,
        };
        this.read(itemGroupDef);
    };
}

export default GenericItemTracker;
