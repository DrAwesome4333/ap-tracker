import React, {
    useContext,
    useMemo,
    useState,
    useSyncExternalStore,
} from "react";
import { useInventoryItems } from "../../hooks/inventoryHook";
import ServiceContext from "../../contexts/serviceContext";
import InventoryItemListView from "./InventoryItemListView";
import StickySpacer from "../shared/StickySpacer";
import { globalOptionManager } from "../../services/options/optionManager";
import useOption from "../../hooks/optionHook";
import { InventoryItemOrder } from "../optionsComponents/InventorySettings";
import { naturalSort } from "../../utility/comparisons";
import PanelHeader from "../shared/PanelHeader";
import { PrimaryButton } from "../buttons";
import Icon from "../icons/icons";
import InventoryFilterOptionsModal from "./InventoryFilterOptionsModal";
import { ItemTrackerType } from "../../services/tracker/resourceEnums";
import { InventoryItem } from "../../services/inventory/inventoryManager";
import { ItemCollectionDef } from "../../services/tracker/itemTrackers/itemTrackers";
import InventoryItemGroupView from "./InventoryItemGroupView";
const emptyList = [];
const InventoryView = () => {
    const services = useContext(ServiceContext);
    const inventoryManager = services.inventoryManager;
    const optionManager = services.optionManager ?? globalOptionManager;
    const itemTracker = services.inventoryTracker;
    const groups: ItemCollectionDef[] = useSyncExternalStore(
        itemTracker?.type === ItemTrackerType.group
            ? itemTracker.getUpdateSubscriber()
            : () => {
                  return () => {};
              },
        itemTracker?.type === ItemTrackerType.group
            ? () => itemTracker.getGroups()
            : () => emptyList,
        itemTracker?.type === ItemTrackerType.group
            ? () => itemTracker.getGroups()
            : () => emptyList
    );

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
            ?.filter(
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
                    // case "count": {
                    //     orderValue = a.value - b.value;
                    //     break;
                    // }
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

    const itemsGroupedByName: InventoryItem[][] = [];
    const itemsGroupedByNameIndex: { [itemName: string]: number } = {};
    sortedItems.forEach((item) => {
        if (itemsGroupedByNameIndex[item.name] === undefined) {
            itemsGroupedByNameIndex[item.name] = itemsGroupedByName.length;
            itemsGroupedByName.push([]);
        }
        const index = itemsGroupedByNameIndex[item.name];
        itemsGroupedByName[index].push(item);
    });

    const itemCollections: {
        type: "group" | "item";
        name: string;
        index: number;
        count: number;
        items: InventoryItem[][];
    }[] = [];
    const pulledItems: Set<string> = new Set();
    groups.forEach((group) => {
        let index = -1;
        const groupItems = itemsGroupedByName.filter((items) => {
            const pullItem =
                group.allowedItems.has(items[0].id) ||
                group.allowedItems.has(items[0].name);
            if (pullItem) {
                pulledItems.add(items[0].name);
                if (index === -1) {
                    index = items[0].index;
                }
            }
            return pullItem;
        });
        if (index !== -1)
            itemCollections.push({
                type: "group",
                name: group.name,
                index,
                items: groupItems,
                count: groupItems.reduce((a, b) => a + b.length, 0),
            });
    });

    itemsGroupedByName.forEach((items) => {
        if (!pulledItems.has(items[0].name)) {
            itemCollections.push({
                type: "item",
                name: items[0].name + "_",
                index: items[0].index,
                count: items.length,
                items: [items],
            });
        }
    });

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
                    {itemTracker?.type !== ItemTrackerType.group ? (
                        <>Unsupported Tracker type {itemTracker?.type}</>
                    ) : (
                        <>
                            {itemCollections.map((collection) =>
                                collection.type === "group" ? (
                                    <InventoryItemGroupView
                                        key={collection.name}
                                        name={collection.name}
                                        items={collection.items}
                                    />
                                ) : (
                                    <InventoryItemListView
                                        key={collection.name}
                                        items={collection.items[0]}
                                    />
                                )
                            )}
                        </>
                    )}

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
