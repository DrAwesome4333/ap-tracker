import React, { useState } from "react";
import { PrimaryButton, SecondaryButton, TextButton } from "../shared/buttons";
import Icon from "../icons/icons";
import NotePad from "../NotePad/NotePad";
import ConnectionOptions from "./ConnectionOptions";
import useCurrentMultiworldSlot from "../../hooks/useCurrentMultiworldSlot";
import { useAPConnectionStatus } from "../../hooks/connectionStatusHook";

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
                        color: connectionStatus.connected
                            ? "chartreuse"
                            : connectionStatus.connecting
                              ? "gold"
                              : connectionStatus.disconnected
                                ? "gray"
                                : "purple",
                    }}
                ></Icon>{" "}
                {slot?.slot_alias && (
                    <TextButton
                        style={{
                            textOverflow: "ellipsis",
                            flex: "auto",
                            textDecoration: "underline",
                        }}
                        onClick={() => setConnectionModalOpen(true)}
                    >
                        {slot.slot_alias}
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
