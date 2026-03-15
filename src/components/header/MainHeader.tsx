import React, { useContext, useState } from "react";
import { TrackerStateContext } from "../../contexts/contexts";
import { PrimaryButton, SecondaryButton, TextButton } from "../shared/buttons";
import Icon from "../icons/icons";
import NotePad from "../NotePad/NotePad";
import ConnectionOptions from "./ConnectionOptions";

const MainHeader = ({
    optionsCallback,
    ...props
}: {
    optionsCallback: React.MouseEventHandler;
}) => {
    // const trackerState = useContext(TrackerStateContext);
    const trackerState = {};
    const [notePadOpen, setNotePadOpen] = useState(false);
    const [connectionModalOpen, setConnectionModalOpen] = useState(false);
    const slot = {};

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
                        color: "chartreuse",
                        // trackerState.connectionStatus ===
                        // CONNECTION_STATUS.connected
                        //     ? "chartreuse"
                        //     : trackerState.connectionStatus ===
                        //         CONNECTION_STATUS.connecting
                        //       ? "gold"
                        //       : trackerState.connectionStatus ===
                        //           CONNECTION_STATUS.disconnected
                        //         ? "gray"
                        //         : trackerState.connectionStatus ===
                        //             CONNECTION_STATUS.error
                        //           ? "red"
                        //           : "purple",
                    }}
                ></Icon>{" "}
                {slot?.alias && (
                    <TextButton
                        style={{
                            textOverflow: "ellipsis",
                            flex: "auto",
                            textDecoration: "underline",
                        }}
                        onClick={() => setConnectionModalOpen(true)}
                    >
                        {slot.alias}
                    </TextButton>
                )}
                <ConnectionOptions
                    open={connectionModalOpen}
                    onClose={() => setConnectionModalOpen(false)}
                />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <PrimaryButton
                    disabled={
                        // trackerState.connectionStatus !==
                        // CONNECTION_STATUS.connected
                        false
                    }
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
                    disabled={
                        // trackerState.connectionStatus !==
                        // CONNECTION_STATUS.connected
                        true
                    }
                />
            }
        </div>
    );
};

export default MainHeader;
