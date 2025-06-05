import React, { useId } from "react";
import { Checkbox } from "../inputs";
import useOption from "../../hooks/optionHook";
import {
    normalItem,
    progressionItem,
    trapItem,
    usefulItem,
} from "../../constants/colors";
import { OptionManager } from "../../services/options/optionManager";

type InventoryItemOrder = "index" | "count" | "name";

const InventorySettings = ({
    optionManager,
}: {
    optionManager: OptionManager;
}) => {
    const showProgression = useOption(
        optionManager,
        "InventoryTracker:show_prog_items",
        "global"
    ) as boolean | null;
    const showUseful = useOption(
        optionManager,
        "InventoryTracker:show_useful_items",
        "global"
    ) as boolean | null;
    const showNormal = useOption(
        optionManager,
        "InventoryTracker:show_normal_items",
        "global"
    ) as boolean | null;
    const showTrap = useOption(
        optionManager,
        "InventoryTracker:show_trap_items",
        "global"
    ) as boolean | null;
    const itemOrder = useOption(
        optionManager,
        "InventoryTracker:item_order",
        "global"
    ) as InventoryItemOrder | null;
    const itemOrderDirection = useOption(
        optionManager,
        "InventoryTracker:item_order_desc",
        "global"
    ) as boolean | null;

    const dropDownId = useId();

    return (
        <>
            <Checkbox
                label="Show progression items"
                checked={showProgression ?? true}
                style={{
                    color: progressionItem,
                }}
                onChange={(event) => {
                    optionManager.setOptionValue(
                        "InventoryTracker:show_prog_items",
                        "global",
                        event.target.checked
                    );
                }}
            />
            <br />
            <Checkbox
                label="Show useful items"
                checked={showUseful ?? true}
                style={{
                    color: usefulItem,
                }}
                onChange={(event) => {
                    optionManager.setOptionValue(
                        "InventoryTracker:show_useful_items",
                        "global",
                        event.target.checked
                    );
                }}
            />
            <br />
            <Checkbox
                label="Show normal items"
                checked={showNormal ?? true}
                style={{
                    color: normalItem,
                }}
                onChange={(event) => {
                    optionManager.setOptionValue(
                        "InventoryTracker:show_normal_items",
                        "global",
                        event.target.checked
                    );
                }}
            />
            <br />
            <Checkbox
                label="Show trap items"
                checked={showTrap ?? true}
                style={{
                    color: trapItem,
                }}
                onChange={(event) => {
                    optionManager.setOptionValue(
                        "InventoryTracker:show_trap_items",
                        "global",
                        event.target.checked
                    );
                }}
            />
            <div>
                <label htmlFor={dropDownId}>Order received items by: </label>
                <select
                    className="interactive"
                    id={dropDownId}
                    value={itemOrder ?? "index"}
                    onChange={(event) => {
                        const value = event.target.value;
                        if (value) {
                            optionManager.setOptionValue(
                                "InventoryTracker:item_order",
                                "global",
                                value
                            );
                        }
                    }}
                >
                    <option value="index">Order Received</option>
                    <option value="name">Name</option>
                    <option value="count">Count</option>
                </select>
            </div>
            <Checkbox
                label="Use descending order"
                checked={itemOrderDirection ?? true}
                onChange={(event) => {
                    optionManager.setOptionValue(
                        "InventoryTracker:item_order_desc",
                        "global",
                        event.target.checked
                    );
                }}
            />
        </>
    );
};

export default InventorySettings;
export type { InventoryItemOrder };
