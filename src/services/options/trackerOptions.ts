import { TrackerOption } from "./option";
import { OptionType } from "./optionEnums";
const baseTrackerOptions: { [optionName: string]: TrackerOption } = {
    "InventoryTracker:show_prog_items": {
        name: "InventoryTracker:show_prog_items",
        display: "Show Progression",
        type: OptionType.boolean,
        default: true,
    },
    "InventoryTracker:show_useful_items": {
        name: "InventoryTracker:show_useful_items",
        display: "Show Useful Items",
        type: OptionType.boolean,
        default: true,
    },
    "InventoryTracker:show_trap_items": {
        name: "InventoryTracker:show_trap_items",
        display: "Show Trap Items",
        type: OptionType.boolean,
        default: true,
    },
    "InventoryTracker:show_normal_items": {
        name: "InventoryTracker:show_normal_items",
        display: "Show Normal Items",
        type: OptionType.boolean,
        default: true,
    },
    "InventoryTracker:item_order": {
        name: "InventoryTracker:item_order",
        display: "Item Order",
        type: OptionType.select,
        choices: [
            { name: "index", display: "Order Received" },
            { name: "name", display: "Name" },
            { name: "count", display: "Count" },
        ],
        default: "index",
    },
    "InventoryTracker:item_order_desc": {
        name: "InventoryTracker:item_order_desc",
        display: "Descending Item Order",
        type: OptionType.boolean,
        default: true,
    },
    "LocationTracker:cleared_location_behavior": {
        name: "LocationTracker:cleared_location_behavior",
        display: "Checked Location Behavior",
        type: OptionType.select,
        choices: [
            { name: "nothing", display: "Nothing" },
            { name: "separate", display: "Separate" },
            { name: "hide", display: "HIde" },
        ],
        default: "nothing",
    },
    "LocationTracker:cleared_section_behavior": {
        name: "LocationTracker:cleared_section_behavior",
        display: "Checked Section Behavior",
        type: OptionType.select,
        choices: [
            { name: "nothing", display: "Nothing" },
            { name: "separate", display: "Separate" },
            { name: "hide", display: "Hide" },
        ],
        default: "nothing",
    },
    "LocationTracker:location_order": {
        name: "LocationTracker:location_order",
        display: "Location Order",
        type: OptionType.select,
        choices: [
            { name: "natural", display: "Natural" },
            { name: "lexical", display: "Lexical" },
            { name: "id", display: "By id" },
        ],
        default: "natural",
    },
    "TextClient:message_filter": {
        name: "TextClient:message_filter",
        display: "Text Client Filters",
        type: OptionType.hierarchical,
        children: [
            {
                name: "allowedTypes",
                display: "Allowed Message Types",
                type: OptionType.multiselect,
                default: ["command", "chat", "status", "login", "misc", "item"],
                choices: ["command", "chat", "status", "login", "misc", "item"],
            },
            {
                name: "itemSendFilter",
                type: OptionType.hierarchical,
                display: "Item Send Filters",
                children: [
                    {
                        name: "own",
                        display: "Items sent to/from me",
                        type: OptionType.multiselect,
                        choices: ["progression", "useful", "normal", "trap"],
                        default: ["progression", "useful", "normal", "trap"],
                    },
                    {
                        name: "others",
                        display: "Items sent from/to others",
                        type: OptionType.multiselect,
                        choices: ["progression", "useful", "normal", "trap"],
                        default: ["progression", "useful", "normal", "trap"],
                    },
                ],
            },
        ],
    },
    "TextClient:show": {
        name: "TextClient:show",
        display: "Show Text Client",
        type: OptionType.boolean,
        default: true,
    },
    "Theme:base": {
        name: "Theme:base",
        display: "Theme",
        type: OptionType.select,
        choices: ["light", "dark", "system"],
        default: "system",
    },
    "Tracker:layout_mode": {
        name: "Tracker:layout_mode",
        display: "Tracker Layout",
        type: OptionType.select,
        default: "auto",
        choices: ["auto", "tabs", "grid"],
    },
};

export { baseTrackerOptions };
