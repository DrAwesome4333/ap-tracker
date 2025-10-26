import { API } from "archipelago.js";
import { HierarchicalOption } from "../../services/options/option";
import { OptionType } from "../../services/options/optionEnums";
import { TempDataStore } from "../../services/dataStores";
import {
    globalOptionManager,
    setOptionDefaults,
} from "../../services/options/optionManager";
type HintFilter = {
    own: string[];
    status: string[];
    sort: "status" | "sender" | "receiver";
};

const statusToText = {
    [API.HintStatus.unspecified]: "Unspecified",
    [API.HintStatus.no_priority]: "No Priority",
    [API.HintStatus.avoid]: "Avoid",
    [API.HintStatus.priority]: "Priority",
    [API.HintStatus.found]: "Found",
};
const optionScope = "HintTab_temp";
const optionDef: HierarchicalOption = {
    type: OptionType.hierarchical,
    name: "HintTabFilters",
    display: "Hint Filters",
    scope: optionScope,
    children: [
        {
            type: OptionType.multiselect,
            display: "Show My",
            name: "own",
            choices: [
                { display: "Items", name: "items" },
                { display: "Locations", name: "locations" },
            ],
            default: ["items", "locations"],
            scope: optionScope,
        },
        {
            type: OptionType.multiselect,
            display: "Show Statuses",
            name: "status",
            choices: Object.entries(statusToText).map(([status, text]) => ({
                display: text,
                name: status,
            })),
            default: Object.entries(statusToText).map(([status]) => status),
            scope: optionScope,
        },
        {
            type: OptionType.select,
            display: "Sort By",
            name: "sort",
            choices: ["status", "sender", "receiver"],
            default: "status",
            scope: optionScope,
        },
    ],
};
const filterDataStore = new TempDataStore();
globalOptionManager.configureScope(optionScope, filterDataStore);
setOptionDefaults(globalOptionManager, { [optionDef.name]: optionDef });
console.log(globalOptionManager.getOptionValue(optionDef.name, optionScope));
export { optionDef, optionScope };
export type { HintFilter };
