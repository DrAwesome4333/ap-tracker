import React, { forwardRef, useContext } from "react";
import MessagePart from "./MessagePart";
import { APMessage } from "../../services/textClientManager";
import NotificationManager from "../../services/notifications/notifications";
import { MessageType } from "../../services/notifications/notifications";
import ServiceContext from "../../contexts/serviceContext";
import useOption from "../../hooks/optionHook";
import { RowComponentProps } from "react-window";

const ClientMessage = forwardRef(
    (
        {
            index,
            style,
            messages,
        }: RowComponentProps<{ messages: APMessage[] }>,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const services = useContext(ServiceContext);
        const copyOnDblClick = useOption(
            services.optionManager,
            "TextClient:DoubleClickToCopy",
            "global"
        );
        const message = messages[index];
        const text = message.parts
            .map((part) => part.text)
            .reduce((a, b) => a + b, "");
        return (
            <div
                ref={ref}
                style={{
                    ...style,
                    padding: "0.25em",
                    backgroundColor:
                        index % 2 === 1
                            ? "rgba(128, 128, 128, 0.2)"
                            : "rgba(0, 0, 0, 0)",
                    width: "100%",
                    boxSizing: "border-box",
                }}
                onDoubleClick={async () => {
                    if (!copyOnDblClick) {
                        return;
                    }
                    try {
                        if (navigator.clipboard) {
                            await navigator.clipboard.writeText(text);
                            NotificationManager.createStatus({
                                message: "Copied to clipboard",
                                type: MessageType.info,
                                progress: 1,
                                duration: 2,
                            });
                        }
                    } catch (e) {
                        console.error("Failed to copy text.", e);
                    }
                }}
            >
                {message.parts.map((part, index) => (
                    // Parts will never change order, we can keep the index as the key
                    <MessagePart part={part} key={index} />
                ))}
            </div>
        );
    }
);

ClientMessage.displayName = "ClientMessage";
export default ClientMessage;
