import React, { forwardRef, useContext } from "react";
import { InventoryItem } from "../../services/inventory/inventoryManager";
import { GhostButton } from "../buttons";
import Icon from "../icons/icons";
import ServiceContext from "../../contexts/serviceContext";
import {
    progressionItem,
    trapItem,
    normalItem,
    usefulItem,
    textClient,
} from "../../constants/colors";
import { TagEntityType } from "../../services/tags/tagManager";

const InventoryItemView = forwardRef(
    (
        { item }: { item: InventoryItem },
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const services = useContext(ServiceContext);
        const locationManager = services.locationManager;
        const tagManager = services.tagManager;
        const locationTagger = services.locationTagger;
        //const connection = services.connector.connection;
        let color = normalItem;
        if (item.progression) {
            color = progressionItem;
        } else if (item.useful) {
            color = usefulItem;
        } else if (item.trap) {
            color = trapItem;
        } else if (item.sender === "Archipelago") {
            color = textClient.yellow;
        }
        return (
            <div
                style={{
                    color,
                }}
                ref={ref}
            >
                <div
                    style={{
                        marginLeft: "1em",
                    }}
                >
                    {item.location} ({item.sender})
                    {item.local && locationManager && tagManager && (
                        <GhostButton
                            onClick={(event) => {
                                const locationId =
                                    locationManager.getLocationStatus(
                                        item.location
                                    )?.id ?? -1;
                                const existingTags = locationTagger
                                    .queryTags(
                                        TagEntityType.location,
                                        locationId
                                    )
                                    .filter((tag) => tag.type_id === "star_1");
                                event.stopPropagation();
                                const found = existingTags.length > 0;
                                if (!found) {
                                    locationTagger.addTag("star_1", locationId);
                                } else if (found) {
                                    locationTagger.removeTag(
                                        existingTags[0].tag_id
                                    );
                                }
                            }}
                            $tiny
                        >
                            <Icon fontSize="12pt" type={"star"} />
                        </GhostButton>
                    )}
                </div>
            </div>
        );
    }
);

InventoryItemView.displayName = "InventoryItemView";

export default InventoryItemView;
