import { GamePackageWrapper } from "./GamePackageWrapper";

class EmptyGamePackageWrapper extends GamePackageWrapper {
    constructor() {
        super(
            {
                location_name_to_id: {},
                item_name_to_id: {},
                checksum: "",
                location_groups: {},
                item_groups: {},
            },
            ""
        );
    }
}

export default EmptyGamePackageWrapper;
