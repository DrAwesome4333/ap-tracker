import React, { useContext } from "react";
import { API, MessageNode } from "archipelago.js";
import * as colors from "../../constants/colors";
import ServiceContext from "../../contexts/serviceContext";
import { EchoMessageNode } from "../../services/textClientManager";
import ap_styles from "../sharedStyles/archipelago.module.css";
const hintStatusToClassMap: { [status: number]: string } = {
    [API.HintStatus.no_priority]: ap_styles.hint_no_priority,
    [API.HintStatus.unspecified]: ap_styles.hint_unspecified,
    [API.HintStatus.avoid]: ap_styles.hint_avoid,
    [API.HintStatus.priority]: ap_styles.hint_prioirty,
    [API.HintStatus.found]: ap_styles.hint_found,
};

const MessagePart = ({ part }: { part: MessageNode | EchoMessageNode }) => {
    const services = useContext(ServiceContext);
    let textColor = null;
    let backgroundColor = undefined;
    let className = "";
    if (part.type === "item") {
        if (part.item.progression) {
            className = ap_styles.item_prog;
        } else if (part.item.useful) {
            className = ap_styles.item_useful;
        } else if (part.item.trap) {
            className = ap_styles.item_trap;
        } else {
            className = ap_styles.item_normal;
        }
    } else if (part.type === "location") {
        className = ap_styles.location;
    } else if (part.type === "player") {
        if (part.text === services.connector?.connection?.slotInfo.alias) {
            className = ap_styles.player;
        } else {
            className = ap_styles.player_other;
        }
    } else if (part.type === "entrance") {
        className = ap_styles.entrance;
    } else if (part.type === "color" || part.type === "echo") {
        if (part.color && part.color.endsWith("_bg")) {
            backgroundColor =
                colors.textClient[
                    part.color.substring(0, part.color.length - 3)
                ];
        } else if (part.color) {
            textColor = colors.textClient[part.color];
        }
    } else if (part.type === "hint_status") {
        className = hintStatusToClassMap[part.hint_status];
    }
    const styles: React.CSSProperties = {
        whiteSpace: "pre-wrap",
    };
    if (textColor) {
        styles.color = textColor;
    }
    if (backgroundColor) {
        styles.backgroundColor = backgroundColor;
    }

    return (
        <span
            style={styles}
            className={className ? className + " " + ap_styles.ap_text : ""}
        >
            {part.text}
        </span>
    );
};

export default MessagePart;
