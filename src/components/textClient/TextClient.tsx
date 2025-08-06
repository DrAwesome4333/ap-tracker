import React, { useContext, useEffect, useRef, useState } from "react";
import { useTextClientMessages } from "../../hooks/textClientHook";
import ServiceContext from "../../contexts/serviceContext";
import ClientMessage from "./ClientMessage";
import { PrimaryButton } from "../buttons";
import { Checkbox } from "../inputs";
import Icon from "../icons/icons";
import { APMessage } from "../../services/textClientManager";
import TextClientTextBox from "./TextClientTextBox";
import TextClientFilterModal from "./TextClientFilterModal";
import PanelHeader from "../shared/PanelHeader";
import LargeList, { RowGenerator } from "../LayoutUtilities/LargeList";

const rowGenerator: RowGenerator<APMessage> = ({ ref, item }) => {
    return (
        <ClientMessage
            ref={ref as React.ForwardedRef<HTMLDivElement>}
            message={item}
        />
    );
};

const TextClient = () => {
    const services = useContext(ServiceContext);
    const textClientManager = services.textClientManager;
    const messages = useTextClientMessages(textClientManager);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [followMessages, setFollowMessages] = useState(true);
    const scrollDebounceTimer = useRef(0);
    const listElementRef: React.ForwardedRef<HTMLElement> = useRef(null);

    const scrollToBottom = () => {
        const totalListHeight = listElementRef.current?.scrollHeight ?? 0;
        scrollDebounceTimer.current = 0;
        listElementRef.current?.scrollTo({
            behavior: "smooth",
            top: totalListHeight,
        });
    };

    // Scroll to bottom when followMessages is enabled, new messages come in, or a row size change happens
    useEffect(() => {
        if (followMessages && !scrollDebounceTimer.current) {
            scrollDebounceTimer.current = window.setTimeout(
                scrollToBottom,
                100
            );
        }
    }, [messages, followMessages]);

    return (
        <>
            <div
                style={{
                    boxSizing: "border-box",
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    gap: "0.25em",
                    gridTemplateRows: "3em 1fr auto",
                    overflow: "hidden",
                    padding: "0.25em",
                }}
            >
                <PanelHeader title={"Text Client"}>
                    <Checkbox
                        onChange={(event) =>
                            setFollowMessages(event.target.checked)
                        }
                        label="Follow Messages"
                        checked={followMessages}
                    />
                    <PrimaryButton
                        $tiny
                        style={{ height: "20px" }}
                        onClick={() => setShowFilterModal(true)}
                    >
                        <Icon fontSize="12pt" type="settings" />
                    </PrimaryButton>
                </PanelHeader>

                <LargeList<APMessage>
                    items={messages}
                    defaultRowSize={19}
                    rowGenerator={rowGenerator}
                    style={{
                        boxSizing: "border-box",
                        overflow: "hidden",
                    }}
                    ref={listElementRef}
                />

                <TextClientTextBox />
            </div>
            <TextClientFilterModal
                open={showFilterModal}
                onClose={() => setShowFilterModal(false)}
            />
        </>
    );
};

export default TextClient;
