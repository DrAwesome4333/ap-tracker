import React, { useState } from "react";
import { InventoryItem } from "../../services/inventory/inventoryManager";
import CollectionContainer from "./CollectionContainer";
import { TextButton } from "../buttons";
import InventoryItemListView from "./InventoryItemListView";
import {
    normalItem,
    progressionItem,
    textClient,
    trapItem,
    usefulItem,
} from "../../constants/colors";
import Icon from "../icons/icons";

const InventoryItemGroupView = ({
    name,
    items,
}: {
    name: string;
    items: InventoryItem[][];
}) => {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const count = items.reduce((a, b) => a + b.length, 0);
    const flags = {
        progression: false,
        useful: false,
        trap: false,
        server: false,
    };
    items.forEach((group) =>
        group.forEach((item) => {
            flags.progression ||= item.progression;
            flags.useful ||= item.useful;
            flags.trap ||= item.trap;
            flags.server ||= item.sender === "Archipelago";
        })
    );

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
                <TextButton style={{ outlineColor: color, fontWeight: "bold" }}>
                    {count} - {name}{" "}
                    {
                        <Icon
                            iconParams={{
                                fill: 0,
                                opticalSize: 20,
                                weight: 700,
                                grade: 200,
                            }}
                            type="arrow_drop_down_circle"
                            fontSize="20px"
                            style={{
                                transform: detailsOpen
                                    ? "rotate(-180deg)"
                                    : "rotate(0deg)",
                                transition: "all 0.25s",
                            }}
                        />
                    }
                </TextButton>
            </CollectionContainer>
            {detailsOpen && (
                <div
                    style={{
                        marginLeft: "1em",
                    }}
                >
                    {items.map((group) => (
                        <InventoryItemListView
                            items={group}
                            key={group[0]?.name ?? ""}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryItemGroupView;
