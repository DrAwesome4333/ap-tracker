import React, { useState } from "react";
import {
    InventoryItemCollection,
    ItemRoundingMode,
} from "../../services/inventory/inventoryManager";
import {
    normalItem,
    progressionItem,
    tertiary,
    trapItem,
    usefulItem,
    textClient,
} from "../../constants/colors";
import styled from "styled-components";
import InventoryItemView from "./InventoryItemView";
import { TextButton } from "../buttons";

const CollectionContainer = styled.div<{
    $collection: InventoryItemCollection;
}>`
    cursor: pointer;
    color: ${(props) =>
        props.$collection.progression
            ? progressionItem
            : props.$collection.useful
              ? usefulItem
              : props.$collection.trap
                ? trapItem
                : normalItem};
    &:hover {
        text-decoration: underline;
    }
`;
const InventoryItemCollectionView = ({
    collection,
}: {
    collection: InventoryItemCollection;
}) => {
    const [detailsOpen, setDetailsOpen] = useState(false);
    let value = collection.value;
    switch (collection.roundingMode) {
        case ItemRoundingMode.down: {
            value = Math.floor(value);
            break;
        }
        case ItemRoundingMode.up: {
            value = Math.ceil(value);
            break;
        }
        case ItemRoundingMode.mid: {
            value = Math.round(value);
            break;
        }
    }

    let color = normalItem;
    if (collection.progression) {
        color = progressionItem;
    } else if (collection.useful) {
        color = usefulItem;
    } else if (collection.trap) {
        color = trapItem;
    } else if (collection.fromServer) {
        color = textClient.yellow;
    }
    return (
        <div>
            <CollectionContainer
                $collection={collection}
                onClick={() => setDetailsOpen((x) => !x)}
            >
                <TextButton style={{ outlineColor: color }}>
                    {value}
                    {collection.total !== undefined &&
                        `/${collection.total}`} - {collection.name}{" "}
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
                    {collection.items.map((item) => (
                        <InventoryItemView item={item} key={item.uuid} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryItemCollectionView;
