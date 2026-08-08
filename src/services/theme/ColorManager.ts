import { useSyncExternalStore } from "react";
import { HierarchicalOption } from "../options/option";
import { OptionType } from "../options/optionEnums";
import {
    globalOptionManager,
    OptionManager,
    setOptionDefaults,
} from "../options/optionManager";

//color to display name
const colorOptionsDef: HierarchicalOption = {
    type: OptionType.hierarchical,
    display: "Text Styles",
    name: "APColors",
    format: "column",
    spacing: "0.75rem",
    children: [
        {
            type: OptionType.color,
            default: "#ff00c7",
            display: "Player (current slot)",
            name: "--ap-player",
            apClasses: ["ap_text", "player"],
        },
        {
            type: OptionType.color,
            default: "#ffd400",
            display: "Player (my other slot)",
            name: "--ap-player-alt",
            apClasses: ["ap_text", "player_alt"],
        },
        {
            type: OptionType.color,
            default: "#ede091",
            display: "Player (other)",
            name: "--ap-player-other",
            apClasses: ["ap_text", "player_other"],
        },
        {
            type: OptionType.color,
            default: "#ff00c7",
            display: "Item Link Group (current slot)",
            name: "--ap-group",
            apClasses: ["ap_text", "group"],
        },
        {
            type: OptionType.color,
            default: "#ffd400",
            display: "Item Link Group (my other slot)",
            name: "--ap-group-alt",
            apClasses: ["ap_text", "group_alt"],
        },
        {
            type: OptionType.color,
            default: "#ede091",
            display: "Item Link Group (other)",
            name: "--ap-group-other",
            apClasses: ["ap_text", "group_other"],
        },
        {
            type: OptionType.color,
            default: "#cc57ff",
            display: "Item (Progression)",
            name: "--ap-item-prog",
            apClasses: ["ap_text", "item_prog"],
        },
        {
            type: OptionType.color,
            default: "#00ffff",
            display: "Item (Normal)",
            name: "--ap-item-normal",
            apClasses: ["ap_text", "item_normal"],
        },
        {
            type: OptionType.color,
            default: "#ff8e72",
            display: "Item (Trap)",
            name: "--ap-item-trap",
            apClasses: ["ap_text", "item_trap"],
        },
        {
            type: OptionType.color,
            default: "#0098ff",
            display: "Item (Useful)",
            name: "--ap-item-useful",
            apClasses: ["ap_text", "item_useful"],
        },
        {
            type: OptionType.color,
            default: "#ffd400",
            display: "Item (Progression + Useful)",
            name: "--ap-item-prog-useful",
            apClasses: ["ap_text", "item_prog_useful"],
        },
        {
            type: OptionType.color,
            default: "#ede091",
            display: "Item (Server)",
            name: "--ap-item-server",
            apClasses: ["ap_text", "item_server"],
        },
        {
            type: OptionType.color,
            default: "#00db26",
            display: "Location",
            name: "--ap-location",
            apClasses: ["ap_text", "location"],
        },
        {
            type: OptionType.color,
            default: "#0098ff",
            display: "Entrance",
            name: "--ap-entrance",
            apClasses: ["ap_text", "entrance"],
        },
        {
            type: OptionType.color,
            default: "#00db26",
            display: "Hint (found)",
            name: "--ap-hint-found",
            apClasses: ["ap_text", "hint_found"],
        },
        {
            type: OptionType.color,
            default: "#00ffff",
            display: "Hint (No Priority)",
            name: "--ap-hint-no-priority",
            apClasses: ["ap_text", "hint_no_priority"],
        },
        {
            type: OptionType.color,
            default: "#cc57ff",
            display: "Hint (Priority)",
            name: "--ap-hint-priority",
            apClasses: ["ap_text", "hint_priority"],
        },
        {
            type: OptionType.color,
            default: "#0098ff",
            display: "Hint (Unspecified)",
            name: "--ap-hint-unspecified",
            apClasses: ["ap_text", "hint_unspecified"],
        },
        {
            type: OptionType.color,
            default: "#ff8e72",
            display: "Hint (Avoid)",
            name: "--ap-hint-avoid",
            apClasses: ["ap_text", "hint_avoid"],
        },
        {
            type: OptionType.select,
            display: "Player Underline",
            name: "--ap-player-underline",
            default: "none",
            choices: [
                { name: "none", display: "None" },
                { name: "wavy underline", display: "Wavy" },
                { name: "underline", display: "Line" },
                { name: "dotted underline", display: "Dotted" },
            ],
        },
        {
            type: OptionType.select,
            display: "Item Link Underline",
            name: "--ap-group-underline",
            default: "none",
            choices: [
                { name: "none", display: "None" },
                { name: "wavy underline", display: "Wavy" },
                { name: "underline", display: "Line" },
                { name: "dotted underline", display: "Dotted" },
            ],
        },
    ],
};

setOptionDefaults(globalOptionManager, { APColors: colorOptionsDef });

const useAPColorStyles = (
    optionManager: OptionManager,
    scope: string = "global"
) => {
    return useSyncExternalStore(
        optionManager.getSubscriberCallback("APColors", scope),
        () =>
            optionManager.getOptionValue(
                "APColors",
                "global"
            ) as React.CSSProperties,
        () =>
            optionManager.getOptionValue(
                "APColors",
                "global"
            ) as React.CSSProperties
    );
};

export { useAPColorStyles, colorOptionsDef };
