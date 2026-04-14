import React, {
    useContext,
    useMemo,
    useState,
    useSyncExternalStore,
} from "react";
import ServiceContext from "../../contexts/serviceContext";
import InventoryItemListView from "./InventoryItemListView";
import StickySpacer from "../shared/StickySpacer";
import { globalOptionManager } from "../../services/options/optionManager";
import useOption from "../../hooks/optionHook";
import { InventoryItemOrder } from "../optionsComponents/InventorySettings";
import { naturalSort } from "../../utility/comparisons";
import PanelHeader from "../shared/PanelHeader";
import { PrimaryButton } from "../shared/buttons";
import Icon from "../icons/icons";
import InventoryFilterOptionsModal from "./InventoryFilterOptionsModal";
import { ItemTrackerType } from "../../services/tracker/resourceEnums";
import { Item } from "../../services/items/itemSource";
import { ItemCollectionDef } from "../../services/tracker/itemTrackers/itemTrackers";
import InventoryItemGroupView from "./InventoryItemGroupView";
import SlotContext from "../../contexts/slotContext";
import { useSlotItems } from "../../hooks/itemHook";
const emptyList = [];
const InventoryView = () => {
    const services = useContext(ServiceContext);
    const optionManager = services.optionManager ?? globalOptionManager;
    const slotContext = useContext(SlotContext);
    const itemTracker = slotContext.itemTracker;
    const groups: ItemCollectionDef[] = useSyncExternalStore(
        itemTracker?.manifest.itemTrackerType === ItemTrackerType.group
            ? itemTracker.getUpdateSubscriber()
            : () => {
                  return () => {};
              },
        itemTracker?.manifest.itemTrackerType === ItemTrackerType.group
            ? () => itemTracker.getGroups()
            : () => emptyList,
        itemTracker?.manifest.itemTrackerType === ItemTrackerType.group
            ? () => itemTracker.getGroups()
            : () => emptyList
    );

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
    const showServer = useOption(
        optionManager,
        "InventoryTracker:show_server_items",
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

    const items = useSlotItems();

    const sortedItems = useMemo(() => {
        const result = items
            ?.filter(
                (collection) =>
                    (collection.flags.progression && showProgression) ||
                    (collection.flags.useful && showUseful) ||
                    (collection.flags.trap && showTrap) ||
                    (collection.sender === "Archipelago" && showServer) ||
                    (!collection.flags.progression &&
                        !collection.flags.useful &&
                        !collection.flags.trap &&
                        collection.sender !== "Archipelago" &&
                        (showNormal ?? true))
            )
            .sort((a, b) => {
                let orderValue = 1;
                switch (itemOrder) {
                    case "name": {
                        orderValue = naturalSort(a.name, b.name);
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
        return result;
    }, [
        showProgression,
        showUseful,
        showTrap,
        showNormal,
        showServer,
        itemOrderDirection_desc,
        itemOrder,
        items,
    ]);

    const itemsGroupedByName: Item[][] = [];
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
        items: Item[][];
    }[] = [];
    const pulledItems: Set<string> = new Set();
    groups.forEach((group) => {
        let index = -1;
        const groupItems = itemsGroupedByName.filter((items) => {
            const pullItem =
                group.allowedItems.has(items[0].locationId) ||
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

    itemCollections.sort((a, b) => {
        let orderValue = 1;
        switch (itemOrder) {
            case "name": {
                orderValue = naturalSort(a.name, b.name);
                break;
            }
            case "count": {
                orderValue = a.count - b.count;
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

    return (
        <>
            <div
                style={{
                    boxSizing: "border-box",
                    display: "grid",
                    gridTemplateRows: "3em auto",
                    width: "100%",
                    height: "100%",
                }}
            >
                <PanelHeader title="Inventory">
                    <PrimaryButton
                        tiny
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
                    {itemTracker?.manifest.itemTrackerType !==
                    ItemTrackerType.group ? (
                        <>
                            Unsupported Tracker type{" "}
                            {itemTracker?.manifest.itemTrackerType}
                        </>
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
