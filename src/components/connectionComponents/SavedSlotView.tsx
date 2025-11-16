import styles from "./SavedSlots.module.css";
import React from "react";
import { SavedSlotDetails } from "../../services/MultiInfo/MultiWorldContext";
import { PrimaryButton, SecondaryButton } from "../buttons";
import Icon from "../icons/icons";

const SavedSlotView = ({
    slot,
    edit,
    connect,
    disabled,
}: {
    slot: SavedSlotDetails;
    edit: () => void;
    connect: () => void;
    disabled: boolean;
}) => {
    console.log(slot);
    return (
        <div className={styles.saved_slot}>
            <div>
                <div style={{ fontWeight: "bold" }}>{slot.title}</div>
                <div>{slot.game}</div>
                <div style={{ fontStyle: "italic" }}>
                    {new Date(slot.last_used_timestamp).toLocaleTimeString([], {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </div>
            <div className={styles.slot_actions}>
                <PrimaryButton $small disabled={disabled} onClick={connect}>
                    <Icon type="play_arrow" />
                </PrimaryButton>
                <SecondaryButton $small disabled={disabled} onClick={edit}>
                    <Icon type="edit" iconParams={{ fill: 0 }} />
                </SecondaryButton>
            </div>
        </div>
    );
};

export default SavedSlotView;
