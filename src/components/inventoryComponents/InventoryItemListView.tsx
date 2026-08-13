import { useState } from "react";
import CollectionContainer from "./CollectionContainer";
import InventoryItemView from "./InventoryItemView";
import { TextButton } from "../shared/buttons";
import { Item } from "../../services/items/itemSource";
import Icon from "../icons/icons";
import { List, useDynamicRowHeight } from "react-window";
import ap_styles from "../sharedStyles/archipelago.module.css";
const InventoryItemListView = ({ items }: { items: Item[] }) => {
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
        flags.progression ||= item.flags.progression;
        flags.useful ||= item.flags.useful;
        flags.trap ||= item.flags.trap;
        flags.server ||= item.sender === "Archipelago";
    });

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
    const rowHeight = useDynamicRowHeight({ defaultRowHeight: 22 });

    return (
        <div>
            <CollectionContainer onClick={() => setDetailsOpen((x) => !x)}>
                <TextButton className={ap_styles.ap_text_alt + " " + itemClass}>
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
                    }}
                >
                    <List
                        style={{
                            overflow: "auto",
                            maxHeight: "75vh",
                            boxShadow: "inset var(--box-shadow-small)",
                            backgroundColor: "var(--background-level-0)",
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
