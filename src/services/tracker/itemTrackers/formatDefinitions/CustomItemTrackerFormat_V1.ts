import { ItemTrackerManifest } from "../itemTrackers";

type CustomItemGroupDef_V1 = {
    /** Optional display name, if undefined, the key of defining dictionary is used */
    name?: string;
    /** A list of item names or ids that contribute to this group */
    items?: (string | number)[];
};

type ItemGroupDef = (string | number)[] | CustomItemGroupDef_V1;
type ItemGroupsDef = { [name: string]: ItemGroupDef };

type CustomItemTrackerDef_V1 = {
    manifest: ItemTrackerManifest;
    groups: ItemGroupsDef;
    /** The version of the definition */
    version: 1;
};

export type {
    ItemGroupDef,
    ItemGroupsDef,
    CustomItemTrackerDef_V1,
    CustomItemGroupDef_V1,
};
