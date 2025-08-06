import React, { forwardRef, useContext } from "react";
import MessagePart from "./MessagePart";
import { APMessage } from "../../services/textClientManager";
import NotificationManager from "../../services/notifications/notifications";
import { MessageType } from "../../services/notifications/notifications";
import ServiceContext from "../../contexts/serviceContext";
import useOption from "../../hooks/optionHook";

const ClientMessage = forwardRef(
    (
        { message }: { message: APMessage },
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const services = useContext(ServiceContext);
        const copyOnDblClick = useOption(
            services.optionManager,
            "TextClient:DoubleClickToCopy",
            "global"
        );
        const text = message.parts
            .map((part) => part.text)
            .reduce((a, b) => a + b, "");
        return (
            <div
                ref={ref}
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
