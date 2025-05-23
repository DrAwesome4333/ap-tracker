/**
 * This file serves as an example to show trackers should only load the needed data once they are prompted to be built, not in the main export
 * Note how the console log does not happen until after a tracker is built for oot.
 */

import { GroupData } from "../../services/sections/groupManager";
import { SectionConfigData } from "../../services/sections/sectionManager";

console.log("OOT module loaded");

const trackerData: Promise<{
    groupData: { [s: string]: GroupData };
    sectionData: SectionConfigData;
}> = import("./data.json").then((module) => module.default);

export { trackerData };
