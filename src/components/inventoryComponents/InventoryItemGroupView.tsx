import React, { useState } from "react";
import { Item } from "../../services/items/itemSource";
import CollectionContainer from "./CollectionContainer";
import { TextButton } from "../shared/buttons";
import InventoryItemListView from "./InventoryItemListView";
import Icon from "../icons/icons";
import ap_styles from "../sharedStyles/archipelago.module.css";

const InventoryItemGroupView = ({
    name,
    items,
}: {
    name: string;
    items: Item[][];
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
            flags.progression ||= item.flags.progression;
            flags.useful ||= item.flags.useful;
            flags.trap ||= item.flags.trap;
            flags.server ||= item.sender === "Archipelago";
        })
    );

    let itemClass = ap_styles.item_normal;
    if (flags.progression) {
        itemClass = ap_styles.item_prog;
    } else if (flags.useful) {
        itemClass = ap_styles.item_useful;
    } else if (flags.trap) {
        itemClass = ap_styles.item_trap;
    } else if (flags.server) {
        itemClass = ap_styles.item_server;
    }
    return (
        <div>
            <CollectionContainer onClick={() => setDetailsOpen((x) => !x)}>
                <TextButton
                    className={ap_styles.ap_text_alt + " " + itemClass}
                    style={{ fontWeight: "bold" }}
                >
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
