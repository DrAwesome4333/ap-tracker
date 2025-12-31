import React from "react";
import OptionView from "./OptionView";
import { baseTrackerOptions } from "../../services/options/trackerOptions";

type InventoryItemOrder = "index" | "count" | "name";

const InventorySettings = () => {
    return (
        <>
            <OptionView
                option={baseTrackerOptions["InventoryTracker:show_prog_items"]}
            />
            <OptionView
                option={
                    baseTrackerOptions["InventoryTracker:show_useful_items"]
                }
            />
            <OptionView
                option={
                    baseTrackerOptions["InventoryTracker:show_normal_items"]
                }
            />
            <OptionView
                option={
                    baseTrackerOptions["InventoryTracker:show_server_items"]
                }
            />
            <OptionView
                option={baseTrackerOptions["InventoryTracker:show_trap_items"]}
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
