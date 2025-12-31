import { PrimaryButton, SecondaryButton } from "../shared/buttons";
import Icon from "../icons/icons";
import styles from "./SavedSlots.module.css";
import React from "react";

const SavedConnectionView = ({
    name,
    game,
    lastUsedTime,
    disabled,
    connect,
    edit,
}: {
    name: string;
    game: string;
    lastUsedTime: number;
    disabled: boolean;
    connect: () => void;
    edit: () => void;
}) => {
    return (
        <div className={styles.saved_slot}>
            <div>
                <div>{name}</div>
                <div>{game}</div>
                <div>
                    <i>
                        {new Date(lastUsedTime).toLocaleTimeString([], {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </i>
                </div>
            </div>
            <div className={styles.slot_actions}>
                <Icon
                    type="warning"
                    style={{ color: "orange" }}
                    iconParams={{ fill: 0 }}
                />
                <PrimaryButton small disabled={disabled} onClick={connect}>
                    <Icon type="play_arrow" />
                </PrimaryButton>
                <SecondaryButton small disabled={disabled} onClick={edit}>
                    <Icon type="edit" iconParams={{ fill: 0 }} />
                </SecondaryButton>
            </div>
        </div>
    );
};

export default SavedConnectionView;
