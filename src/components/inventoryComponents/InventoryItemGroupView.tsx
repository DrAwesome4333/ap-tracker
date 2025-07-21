import React, { useState } from "react";
import { InventoryItem } from "../../services/inventory/inventoryManager";
import CollectionContainer from "./CollectionContainer";
import { TextButton } from "../buttons";
import InventoryItemListView from "./InventoryItemListView";

const InventoryItemGroupView = ({
    name,
    items,
}: {
    name: string;
    items: InventoryItem[][];
}) => {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const color = "orange";
    const count = items.reduce((a, b) => a + b.length, 0);
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
