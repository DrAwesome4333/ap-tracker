import React, { useState } from "react";
import {
    normalItem,
    progressionItem,
    tertiary,
    trapItem,
    usefulItem,
    textClient,
} from "../../constants/colors";
import CollectionContainer from "./CollectionContainer";
import InventoryItemView from "./InventoryItemView";
import { TextButton } from "../buttons";
import { InventoryItem } from "../../services/inventory/inventoryManager";
import Icon from "../icons/icons";
import { List, useDynamicRowHeight } from "react-window";

const InventoryItemListView = ({ items }: { items: InventoryItem[] }) => {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const count = items.length;
    const flags = {
        progression: false,
        useful: false,
        trap: false,
        server: false,
    };
    const name = items[0]?.name ?? "Empty Collection";
    items.forEach((item) => {
        flags.progression ||= item.progression;
        flags.useful ||= item.useful;
        flags.trap ||= item.trap;
        flags.server ||= item.sender === "Archipelago";
        if (item.name !== name) {
            console.warn("");
        }
    });

    let color = normalItem;
    if (flags.progression) {
        color = progressionItem;
    } else if (flags.useful) {
        color = usefulItem;
    } else if (flags.trap) {
        color = trapItem;
    } else if (flags.server) {
        color = textClient.yellow;
    }
    const rowHeight = useDynamicRowHeight({ defaultRowHeight: 22 });

    return (
        <div>
            <CollectionContainer
                $color={color}
                onClick={() => setDetailsOpen((x) => !x)}
            >
                <TextButton style={{ outlineColor: color }}>
                    {count} - {name}
                    {
                        <Icon
                            iconParams={{
                                fill: 0,
                                opticalSize: 20,
                                weight: 700,
                                grade: 200,
                            }}
                            type="arrow_drop_down"
                            fontSize="20px"
                            style={{
                                transform: detailsOpen
                                    ? "rotate(0deg)"
                                    : "rotate(-90deg)",
                                transition: "all 0.25s",
                                userSelect: "none",
                            }}
                        />
                    }
                </TextButton>
            </CollectionContainer>
            {detailsOpen && (
                <div
                    style={{
                        marginLeft: "1em",
                        fontStyle: "italic",
                        textDecoration: "none",
                        color: tertiary,
                    }}
                >
                    <List
                        style={{
                            overflow: "hidden",
                            maxHeight: "75vh",
                            boxShadow: "2px 3px 5px rgba(0, 0, 0, 0.5)",
                        }}
                        rowComponent={InventoryItemView}
                        rowCount={items.length}
                        rowHeight={rowHeight}
                        rowProps={{ items }}
                    />
                </div>
            )}
        </div>
    );
};

export default InventoryItemListView;
