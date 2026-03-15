import React, { forwardRef, useContext } from "react";
import { Item } from "../../services/items/itemSource";
import { GhostButton } from "../shared/buttons";
import Icon from "../icons/icons";
import ServiceContext from "../../contexts/serviceContext";
import { RowComponentProps } from "react-window";
import ap_styles from "../sharedStyles/archipelago.module.css";
import MultiWorldContext from "../../services/MultiInfo/MultiWorldContext";

const InventoryItemView = forwardRef(
    (
        { items, index, style }: RowComponentProps<{ items: Item[] }>,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const item = items[index];
        const services = useContext(ServiceContext);
        const tagManager = services.tagManager;
        const locationTagger = services.locationTagger;

        let itemClass = ap_styles.item_normal;
        if (item.flags.progression) {
            itemClass = ap_styles.item_prog;
        } else if (item.flags.useful) {
            itemClass = ap_styles.item_useful;
        } else if (item.flags.trap) {
            itemClass = ap_styles.item_trap;
        } else if (item.sender === "Archipelago") {
            itemClass = ap_styles.item_server;
        }

        const playerClass =
            item.senderSlot === MultiWorldContext.loadedSlot.slot_number
                ? ap_styles.player
                : MultiWorldContext.loadedMultiWorld.slots.find(
                        (slot) => slot.slot_number === item.senderSlot
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
                    {item.flags.local && tagManager && (
                        <GhostButton
                            onClick={(event) => {
                                const locationId = item.locationId;
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
