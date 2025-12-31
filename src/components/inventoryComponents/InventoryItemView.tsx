import React, { forwardRef, useContext } from "react";
import { InventoryItem } from "../../services/inventory/inventoryManager";
import { GhostButton } from "../shared/buttons";
import Icon from "../icons/icons";
import ServiceContext from "../../contexts/serviceContext";
import { RowComponentProps } from "react-window";
import ap_styles from "../sharedStyles/archipelago.module.css";
import MultiWorldContext from "../../services/MultiInfo/MultiWorldContext";

const InventoryItemView = forwardRef(
    (
        { items, index, style }: RowComponentProps<{ items: InventoryItem[] }>,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const item = items[index];
        const services = useContext(ServiceContext);
        const locationManager = services.locationManager;
        const tagManager = services.tagManager;
        const locationTagger = services.locationTagger;

        let itemClass = ap_styles.item_normal;
        if (item.progression) {
            itemClass = ap_styles.item_prog;
        } else if (item.useful) {
            itemClass = ap_styles.item_useful;
        } else if (item.trap) {
            itemClass = ap_styles.item_trap;
        } else if (item.sender === "Archipelago") {
            itemClass = ap_styles.item_server;
        }

        const playerClass =
            item.sender_slot === MultiWorldContext.loadedSlot.slot_number
                ? ap_styles.player
                : MultiWorldContext.loadedMultiWorld.slots.find(
                        (slot) => slot.slot_number === item.sender_slot
                    )
                  ? ap_styles.player_alt
                  : ap_styles.player_other;
        return (
            <div
                className={ap_styles.ap_text_alt + " " + itemClass}
                style={{
                    ...style,
                }}
                ref={ref}
            >
                <div
                    style={{
                        marginLeft: "0.5em",
                    }}
                >
                    <span
                        className={[
                            ap_styles.ap_text_alt,
                            ap_styles.location,
                        ].join(" ")}
                    >
                        {item.location}
                    </span>{" "}
                    <span
                        className={[ap_styles.ap_text_alt, playerClass].join(
                            " "
                        )}
                    >
                        {item.sender}
                    </span>
                    {item.local && locationManager && tagManager && (
                        <GhostButton
                            onClick={(event) => {
                                const locationId =
                                    locationManager.getLocationStatus(
                                        item.location
                                    )?.id ?? -1;
                                const existingTags = locationTagger
                                    .queryTags("star", locationId)
                                    .filter((tag) => tag.type_id === "star");
                                event.stopPropagation();
                                const found = existingTags.length > 0;
                                if (!found) {
                                    locationTagger.addTag("star", locationId);
                                } else if (found) {
                                    locationTagger.removeTag(
                                        existingTags[0].tag_id
                                    );
                                }
                            }}
                            tiny
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
