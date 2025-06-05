import React, { useContext, useMemo, useState } from "react";
import { useInventoryItems } from "../../hooks/inventoryHook";
import ServiceContext from "../../contexts/serviceContext";
import InventoryItemCollectionView from "./InventoryItemCollectionView";
import StickySpacer from "../shared/StickySpacer";
import { globalOptionManager } from "../../services/options/optionManager";
import useOption from "../../hooks/optionHook";
import { InventoryItemOrder } from "../optionsComponents/InventorySettings";
import { naturalSort } from "../../utility/comparisons";
import PanelHeader from "../shared/PanelHeader";
import { PrimaryButton } from "../buttons";
import Icon from "../icons/icons";
import InventoryFilterOptionsModal from "./InventoryFilterOptionsModal";

const InventoryView = () => {
    const services = useContext(ServiceContext);
    const inventoryManager = services.inventoryManager;
    const optionManager = services.optionManager ?? globalOptionManager;
    if (!inventoryManager) {
        throw new Error(
            "Inventory manager not provided to inventory view service list"
        );
    }

    const [showFilterModal, setShowFilterModal] = useState(false);
    const showProgression = useOption(
        optionManager,
        "InventoryTracker:show_prog_items",
        "global"
    ) as boolean;
    const showUseful = useOption(
        optionManager,
        "InventoryTracker:show_useful_items",
        "global"
    ) as boolean;
    const showNormal = useOption(
        optionManager,
        "InventoryTracker:show_normal_items",
        "global"
    ) as boolean;
    const showTrap = useOption(
        optionManager,
        "InventoryTracker:show_trap_items",
        "global"
    ) as boolean;
    const itemOrder = useOption(
        optionManager,
        "InventoryTracker:item_order",
        "global"
    ) as InventoryItemOrder;
    const itemOrderDirection_desc = useOption(
        optionManager,
        "InventoryTracker:item_order_desc",
        "global"
    ) as boolean;

    const items = useInventoryItems(inventoryManager);
    const sortedItems = useMemo(() => {
        return items
            .filter(
                (collection) =>
                    (collection.progression && (showProgression ?? true)) ||
                    (collection.useful && (showUseful ?? true)) ||
                    (collection.trap && (showTrap ?? true)) ||
                    (!collection.progression &&
                        !collection.useful &&
                        !collection.trap &&
                        (showNormal ?? true))
            )
            .sort((a, b) => {
                let orderValue = 1;
                switch (itemOrder) {
                    case "name": {
                        orderValue = naturalSort(a.name, b.name);
                        break;
                    }
                    case "count": {
                        orderValue = a.value - b.value;
                        break;
                    }
                    case "index": // fall through
                    default: {
                        orderValue = a.index - b.index;
                        break;
                    }
                }
                if (itemOrderDirection_desc ?? true) {
                    orderValue *= -1;
                }
                return orderValue;
            });
    }, [
        showProgression,
        showUseful,
        showTrap,
        showNormal,
        itemOrderDirection_desc,
        itemOrder,
        items,
    ]);
    return (
        <>
            <div
                style={{
                    boxSizing: "border-box",
                    padding: "0.25em",
                    display: "grid",
                    gridTemplateRows: "3em auto",
                    width: "100%",
                    height: "100%",
                }}
            >
                <PanelHeader title="Inventory">
                    <PrimaryButton
                        $tiny
                        style={{ height: "20px" }}
                        onClick={() => setShowFilterModal(true)}
                    >
                        <Icon fontSize="12pt" type="filter_alt" />
                    </PrimaryButton>
                </PanelHeader>
                <div
                    style={{
                        height: "100%",
                        width: "100%",
                        overflowY: "scroll",
                        padding: "0.25em",
                        boxSizing: "border-box",
                    }}
                >
                    {sortedItems.map((collection) => (
                        <InventoryItemCollectionView
                            key={collection.name}
                            collection={collection}
                        />
                    ))}
                    <StickySpacer />
                </div>
            </div>
            <InventoryFilterOptionsModal
                open={showFilterModal}
                onClose={() => setShowFilterModal(false)}
            />
        </>
    );
};

export default InventoryView;
