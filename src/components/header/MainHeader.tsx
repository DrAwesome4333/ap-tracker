import React, { useContext, useState } from "react";
import { PrimaryButton, SecondaryButton, TextButton } from "../shared/buttons";
import Icon from "../icons/icons";
import NotePad from "../NotePad/NotePad";
import ConnectionOptions from "./ConnectionOptions";
import useCurrentMultiworldSlot from "../../hooks/useCurrentMultiworldSlot";
import { useAPConnectionStatus } from "../../hooks/connectionStatusHook";
import { useCurrentActivity } from "../../hooks/activityHook";
import MultiWorldService from "../../services/MultiInfo/MultiWorldService";
import SlotContext from "../../contexts/slotContext";

const MainHeader = ({
    optionsCallback,
    ...props
}: {
    optionsCallback: React.MouseEventHandler;
}) => {
    const connectionStatus = useAPConnectionStatus();
    const [notePadOpen, setNotePadOpen] = useState(false);
    const [connectionModalOpen, setConnectionModalOpen] = useState(false);
    const slot = useCurrentMultiworldSlot();

    const currentPage = useCurrentActivity();
    const slotContext = useContext(SlotContext);
    const multiWorldId =
        currentPage?.split("/")[1] ?? slotContext.multiWorldId ?? null;
    const multiWorld = multiWorldId
        ? MultiWorldService.getMultiWorld(multiWorldId)
        : null;
    const onMultiTrackerScreen = currentPage?.startsWith("multi-world-tracker");

    // if (
    //     trackerState.connectionStatus !== CONNECTION_STATUS.connected &&
    //     connectionModalOpen
    // ) {
    //     setConnectionModalOpen(false);
    // }

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                width: "100vw",
                position: "sticky",
                top: "0px",
                boxShadow: "var(--box-shadow)",
                zIndex: "2",
                backgroundColor: "var(--background-level-2)",
            }}
        >
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    columnGap: "0.5rem",
                    alignItems: "center",
                    overflowX: "auto",
                    overflowY: "hidden",
                    paddingLeft: "0.5em",
                }}
                {...props}
            >
                <Icon
                    type="circle"
                    fontSize="0.5rem"
                    style={{
                        color: onMultiTrackerScreen
                            ? "blue"
                            : connectionStatus.connected
                              ? "chartreuse"
                              : connectionStatus.connecting
                                ? "gold"
                                : connectionStatus.disconnected
                                  ? "gray"
                                  : "purple",
                    }}
                ></Icon>{" "}
                {(slot?.slot_alias || onMultiTrackerScreen) && (
                    <TextButton
                        style={{
                            textOverflow: "ellipsis",
                            flex: "auto",
                            textDecoration: "underline",
                        }}
                        onClick={() => setConnectionModalOpen(true)}
                    >
                        {onMultiTrackerScreen
                            ? multiWorld.title
                            : slot.slot_alias}
                    </TextButton>
                )}
                <ConnectionOptions
                    open={connectionModalOpen}
                    onClose={() => setConnectionModalOpen(false)}
                />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <PrimaryButton
                    disabled={!connectionStatus.connected}
                    small
                    onClick={() => {
                        setNotePadOpen(true);
                    }}
                >
                    <Icon type="sticky_note" />
                </PrimaryButton>
                <SecondaryButton small onClick={optionsCallback}>
                    <Icon type="settings" />
                </SecondaryButton>
            </div>
            {
                <NotePad
                    open={notePadOpen}
                    onClose={() => {
                        setNotePadOpen(false);
                    }}
                    disabled={!connectionStatus.connected}
                />
            }
        </div>
    );
};

export default MainHeader;
