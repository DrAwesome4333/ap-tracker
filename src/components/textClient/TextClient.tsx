import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { useTextClientMessages } from "../../hooks/textClientHook";
import ServiceContext from "../../contexts/serviceContext";
import ClientMessage from "./ClientMessage";
import { PrimaryButton } from "../buttons";
import { Checkbox } from "../inputs";
import Icon from "../icons/icons";
import TextClientTextBox from "./TextClientTextBox";
import TextClientFilterModal from "./TextClientFilterModal";
import PanelHeader from "../shared/PanelHeader";
import { List, ListImperativeAPI, useDynamicRowHeight } from "react-window";

const TextClient = () => {
    const services = useContext(ServiceContext);
    const textClientManager = services.textClientManager;
    const messages = useTextClientMessages(textClientManager);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [followMessages, setFollowMessages] = useState(true);
    const scrollDebounceTimer = useRef(0);
    const listRef: React.ForwardedRef<ListImperativeAPI> = useRef(null);
    const rowHeight = useDynamicRowHeight({ defaultRowHeight: 23 });
    const scrollToBottom = useCallback(() => {
        scrollDebounceTimer.current = 0;
        if (messages.length > 0) {
            const element = listRef.current?.element;
            element.scrollTo({
                behavior: "smooth",
                top: element.scrollHeight,
            });
        }
    }, [scrollDebounceTimer, messages, listRef]);
    // Scroll to bottom when followMessages is enabled, new messages come in, or a row size change happens
    useEffect(() => {
        if (followMessages) {
            if (scrollDebounceTimer.current) {
                window.clearTimeout(scrollDebounceTimer.current);
            }
            scrollDebounceTimer.current = window.setTimeout(
                scrollToBottom,
                100
            );
        }
    }, [messages, followMessages, scrollToBottom]);

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
                <List
                    listRef={listRef}
                    rowComponent={ClientMessage}
                    rowCount={messages.length}
                    rowHeight={rowHeight}
                    rowProps={{ messages }}
                    overscanCount={5}
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
