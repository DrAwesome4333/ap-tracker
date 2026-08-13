import React, { useContext } from "react";
import { API, MessageNode } from "archipelago.js";
import * as colors from "../../constants/colors";
import { EchoMessageNode } from "../../services/textClientManager";
import ap_styles from "../sharedStyles/archipelago.module.css";
import MultiWorldContext from "../../contexts/multiWorldContext";
import {
    MultiWorldContextHelper,
    SlotRelevance,
} from "../../services/MultiInfo/MultiWorldContextData";
const hintStatusToClassMap: { [status: number]: string } = {
    [API.HintStatus.no_priority]: ap_styles.hint_no_priority,
    [API.HintStatus.unspecified]: ap_styles.hint_unspecified,
    [API.HintStatus.avoid]: ap_styles.hint_avoid,
    [API.HintStatus.priority]: ap_styles.hint_priority,
    [API.HintStatus.found]: ap_styles.hint_found,
};

const MessagePart = ({ part }: { part: MessageNode | EchoMessageNode }) => {
    const multiWorldContext = useContext(MultiWorldContext);
    let textColor = null;
    let backgroundColor = undefined;
    let className = "";
    let additionalInfo: string = null;
    if (part.type === "item") {
        className = ap_styles.item_normal;
        const itemClasses = [];
        if (part.item.trap) {
            className = ap_styles.item_trap;
            itemClasses.push("Trap");
        }
        if (part.item.useful) {
            className = ap_styles.item_useful;
            itemClasses.push("Useful");
        }
        if (part.item.progression) {
            className = ap_styles.item_prog;
            itemClasses.push("Progression");
        }
        if (part.item.progression && part.item.useful) {
            className = ap_styles.item_prog_useful;
        }
        if (itemClasses.length === 0) {
            itemClasses.push("Normal");
        }
        additionalInfo = `Game: ${part.item.game}, Class: ${itemClasses.join(", ")}`;
    } else if (part.type === "location") {
        className = ap_styles.location;
    } else if (part.type === "player") {
        const playerRelevance = MultiWorldContextHelper.getSlotRelevance(
            multiWorldContext,
            part.player.slot
        );
        if (playerRelevance === SlotRelevance.own) {
            className = ap_styles.player;
        } else if (playerRelevance === SlotRelevance.own_group) {
            className = ap_styles.group;
        } else if (playerRelevance === SlotRelevance.tracked) {
            className = ap_styles.player_alt;
        } else if (playerRelevance === SlotRelevance.tracked_group) {
            className = ap_styles.group_alt;
        } else if (playerRelevance === SlotRelevance.other_group) {
            className = ap_styles.group_other;
        } else {
            className = ap_styles.player_other;
        }
        additionalInfo = `Game: ${part.player.game}`;
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
            title={additionalInfo}
        >
            {part.text}
        </span>
    );
};

export default MessagePart;
