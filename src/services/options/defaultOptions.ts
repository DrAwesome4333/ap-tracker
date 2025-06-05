import { MessageFilter } from "../textClientManager";

const globalDefaults = {
    "InventoryTracker:show_prog_items": true,
    "InventoryTracker:show_useful_items": true,
    "InventoryTracker:show_trap_items": true,
    "InventoryTracker:show_normal_items": true,
    "InventoryTracker:item_order": "index",
    "InventoryTracker:item_order_desc": true,
    "LocationTracker:cleared_location_behavior": "nothing",
    "LocationTracker:cleared_section_behavior": "nothing",
    "LocationTracker:location_order": "natural",
    "TextClient:message_filter": {
        allowedTypes: ["command", "chat", "status", "login", "misc", "item"],
        itemSendFilter: {
            own: ["trap", "progression", "useful", "normal"],
            others: ["trap", "progression", "useful", "normal"],
        },
    } as MessageFilter,
    "TextClient:show": true,
    "Theme:base": "system",
    "Tracker:layout_mode": "auto",
};

export { globalDefaults };
