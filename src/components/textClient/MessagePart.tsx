import React, { useContext } from "react";
import { MessageNode } from "archipelago.js";
import * as colors from "../../constants/colors";
import ServiceContext from "../../contexts/serviceContext";
import { EchoMessageNode } from "../../services/textClientManager";

const hintStatusToColorMap: { [status: number]: string } = {
    0: null,
    10: colors.tertiary,
    20: colors.trapItem,
    30: colors.progressionItem,
    40: colors.textClient.green,
};

const MessagePart = ({ part }: { part: MessageNode | EchoMessageNode }) => {
    const services = useContext(ServiceContext);
    let textColor = colors.textPrimary;
    let backgroundColor = undefined;
    let underline = false;
    let bold = false;
    if (part.type === "item") {
        if (part.item.progression) {
            textColor = colors.progressionItem;
        } else if (part.item.useful) {
            textColor = colors.usefulItem;
        } else if (part.item.trap) {
            textColor = colors.trapItem;
        } else {
            textColor = colors.normalItem;
        }
    } else if (part.type === "location") {
        textColor = colors.textClient.green;
    } else if (part.type === "player") {
        if (part.text === services.connector?.connection?.slotInfo.alias) {
            textColor = colors.textClient.magenta;
        } else {
            textColor = colors.textClient.yellow;
        }
    } else if (part.type === "entrance") {
        textColor = colors.textClient.blue;
    } else if (part.type === "color" || part.type === "echo") {
        if (part.color === "underline") {
            underline = true;
        } else if (part.color === "bold") {
            bold = true;
        } else if (part.color && part.color.endsWith("_bg")) {
            backgroundColor =
                colors.textClient[
                    part.color.substring(0, part.color.length - 3)
                ];
        } else if (part.color) {
            textColor = colors.textClient[part.color];
        }
    } else if (part.type === "hint_status") {
        const color = hintStatusToColorMap[part.hint_status];
        if (color) {
            textColor = color;
            bold = true;
        }
    }

    return (
        <span
            style={{
                color: textColor,
                backgroundColor,
                textDecoration: underline ? "underline" : undefined,
                fontWeight: bold ? "bold" : "normal",
                whiteSpace: "pre-wrap",
            }}
        >
            {part.text}
        </span>
    );
};

export default MessagePart;
