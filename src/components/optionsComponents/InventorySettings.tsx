import React from "react";
import {
    normalItem,
    progressionItem,
    trapItem,
    usefulItem,
} from "../../constants/colors";
import OptionView from "./OptionView";
import { baseTrackerOptions } from "../../services/options/trackerOptions";

type InventoryItemOrder = "index" | "count" | "name";

const InventorySettings = () => {
    return (
        <>
            <OptionView
                option={baseTrackerOptions["InventoryTracker:show_prog_items"]}
                style={{ color: progressionItem }}
            />
            <OptionView
                option={
                    baseTrackerOptions["InventoryTracker:show_useful_items"]
                }
                style={{ color: usefulItem }}
            />
            <OptionView
                option={
                    baseTrackerOptions["InventoryTracker:show_normal_items"]
                }
                style={{ color: normalItem }}
            />
            <OptionView
                option={baseTrackerOptions["InventoryTracker:show_trap_items"]}
                style={{ color: trapItem }}
            />
            <OptionView
                option={baseTrackerOptions["InventoryTracker:item_order"]}
            />
            <OptionView
                option={baseTrackerOptions["InventoryTracker:item_order_desc"]}
            />
        </>
    );
};

export default InventorySettings;
export type { InventoryItemOrder };
