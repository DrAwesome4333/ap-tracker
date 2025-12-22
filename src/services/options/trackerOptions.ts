import { TrackerOption } from "./option";
import { OptionType } from "./optionEnums";
const baseTrackerOptions: { [optionName: string]: TrackerOption } = {
    "InventoryTracker:show_prog_items": {
        name: "InventoryTracker:show_prog_items",
        display: "Show Progression",
        type: OptionType.boolean,
        default: true,
        apClasses: ["ap_text_alt", "item_prog"],
    },
    "InventoryTracker:show_useful_items": {
        name: "InventoryTracker:show_useful_items",
        display: "Show Useful Items",
        type: OptionType.boolean,
        default: true,
        apClasses: ["ap_text_alt", "item_useful"],
    },
    "InventoryTracker:show_trap_items": {
        name: "InventoryTracker:show_trap_items",
        display: "Show Trap Items",
        type: OptionType.boolean,
        default: true,
        apClasses: ["ap_text_alt", "item_trap"],
    },
    "InventoryTracker:show_normal_items": {
        name: "InventoryTracker:show_normal_items",
        display: "Show Normal Items",
        type: OptionType.boolean,
        default: true,
        apClasses: ["ap_text_alt", "item_normal"],
    },
    "InventoryTracker:show_server_items": {
        name: "InventoryTracker:show_server_items",
        display: "Show Server Items",
        type: OptionType.boolean,
        default: true,
        apClasses: ["ap_text_alt", "item_server"],
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
            { name: "hide", display: "Hide" },
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
            { name: "natural", display: "Natural" }, // ex: A1, A2, A10, A11
            { name: "lexical", display: "Lexical" }, // ex: A1, A10, A11, A2
            { name: "id", display: "By Id" }, // Defined by assigned Archipelago id
            { name: "listed", display: "Tracker Ordered" }, // Order as read from tracker file
        ],
        default: "listed",
    },
    "LocationTracker:allow_tracker_option_overrides": {
        name: "LocationTracker:allow_tracker_option_overrides",
        display: "Use Tracker Recommended Ordering",
        type: OptionType.boolean,
        default: true,
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
    "TextClient:DoubleClickToCopy": {
        name: "TextClient:DoubleClickToCopy",
        display: "Copy text client message via double click",
        type: OptionType.boolean,
        default: true,
    },
    "TextClient:IncludeMyOtherSlots": {
        name: "TextClient:IncludeMyOtherSlots",
        display: "Consider my other slots",
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
        choices: [
            { name: "auto", display: "Auto" },
            { name: "tab", display: "Tabs" },
            { name: "flex", display: "Grid" },
        ],
    },
    "Tags:hint_settings": {
        name: "Tags:hint_settings",
        display: "Hint Tag Settings",
        type: OptionType.hierarchical,
        children: [
            {
                name: "tag",
                display: "Tags",
                type: OptionType.multiselect,
                default: ["priority"],
                choices: [
                    { name: "priority", display: "Priority" },
                    { name: "avoid", display: "Avoid" },
                    { name: "found", display: "Found" },
                    { name: "unspecified", display: "Unspecified" },
                    { name: "no_priority", display: "No Priority" },
                ],
            },
            {
                name: "counter",
                display: "Display Counters",
                type: OptionType.multiselect,
                default: ["priority"],
                choices: [
                    { name: "priority", display: "Priority" },
                    { name: "avoid", display: "Avoid" },
                    { name: "found", display: "Found" },
                    { name: "unspecified", display: "Unspecified" },
                    { name: "no_priority", display: "No Priority" },
                ],
            },
        ],
    },
};

export { baseTrackerOptions };
