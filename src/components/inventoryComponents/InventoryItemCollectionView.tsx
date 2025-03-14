import React, { useContext, useState } from "react";
import {
    InventoryItem,
    InventoryItemCollection,
} from "../../services/inventory/inventoryManager";
import {
    normalItem,
    progressionItem,
    tertiary,
    textPrimary,
    trapItem,
    usefulItem,
} from "../../constants/colors";
import { GhostButton } from "../buttons";
import Icon from "../icons/icons";
import ServiceContext from "../../contexts/serviceContext";
import styled from "styled-components";

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
    const serviceContext = useContext(ServiceContext);
    const checkManager = serviceContext.checkManager;
    const tagManager = serviceContext.tagManager;
    const connection = serviceContext.connector;
    const [detailsOpen, setDetailsOpen] = useState(false);
    return (
        <div>
            <CollectionContainer
                $collection={collection}
                onClick={() => setDetailsOpen((x) => !x)}
            >
                {collection.count} - {collection.name}{" "}
                {detailsOpen ? " ▲ " : " ▼ "}
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
                        <div key={item.index}>
                            {item.location} - {item.sender}{" "}
                            {item.local && checkManager && tagManager && (
                                <GhostButton
                                    onClick={(event) => {
                                        let check = item.location;
                                        let status =
                                            checkManager.getCheckStatus(check);
                                        event.stopPropagation();
                                        let found = false;
                                        status.tags?.forEach((tag) => {
                                            if (tag.tagId === `${check}-star`) {
                                                found = true;
                                            }
                                        });
                                        if (!found) {
                                            let tagData =
                                                tagManager.createTagData();
                                            tagData.typeId = "star";
                                            tagData.checkName = check;
                                            tagData.tagId = `${check}-star`;
                                            tagManager.addTag(
                                                tagData,
                                                connection.connection.slotInfo
                                                    .connectionId
                                            );
                                        } else if (found) {
                                            let starTag =
                                                tagManager.createTagData();
                                            starTag.typeId = "star";
                                            starTag.checkName = check;
                                            starTag.tagId = `${check}-star`;
                                            tagManager.removeTag(
                                                starTag,
                                                connection.connection.slotInfo
                                                    .connectionId
                                            );
                                        }
                                    }}
                                    // @ts-ignore
                                    $tiny
                                >
                                    <Icon fontSize="12pt" type={"star"} />
                                </GhostButton>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryItemCollectionView;
