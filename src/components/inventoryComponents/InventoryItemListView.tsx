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

/** Renders a list of locations for a given item. Will throw warnings if all items do not have the same name */
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

    return (
        <div>
            <CollectionContainer
                $color={color}
                onClick={() => setDetailsOpen((x) => !x)}
            >
                <TextButton style={{ outlineColor: color }}>
                    {count} - {name}
                    {detailsOpen ? " ▲ " : " ▼ "}
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
                    {items.map((item) => (
                        <InventoryItemView item={item} key={item.uuid} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryItemListView;
