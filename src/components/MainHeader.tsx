import React, { useContext, useState } from "react";
import { TrackerStateContext } from "../contexts/contexts";
import { PrimaryButton, SecondaryButton } from "./buttons";
import Icon from "./icons/icons";
import { background } from "../constants/colors";
import NotePad from "./NotePad";
import { CONNECTION_STATUS } from "../services/connector/connector";
import ConnectionIcon from "./icons/ConnectionIcon";

const MainHeader = ({
    optionsCallback,
    ...props
}: {
    optionsCallback: React.MouseEventHandler;
}) => {
    const trackerState = useContext(TrackerStateContext);
    const [notePadOpen, setNotePadOpen] = useState(false);
    const slot = trackerState.slotData;
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                width: "100vw",
                position: "sticky",
                top: "0px",
                boxShadow: "3px 4px 0px rgba(0, 0, 0, 0.5)",
                zIndex: "2",
                backgroundColor: background,
            }}
        >
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    columnGap: "1rem",
                    alignItems: "center",
                    overflowX: "auto",
                    overflowY: "hidden",
                }}
                {...props}
            >
                {" "}
                <div style={{ width: "2.5em", margin: "0.25em" }}>
                    <ConnectionIcon status={trackerState.connectionStatus} />
                </div>
                {slot?.alias && (
                    <div style={{ textOverflow: "ellipsis", flex: "auto" }}>
                        {slot.alias}
                    </div>
                )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <PrimaryButton
                    disabled={
                        trackerState.connectionStatus !==
                        CONNECTION_STATUS.connected
                    }
                    $small
                    onClick={() => {
                        setNotePadOpen(true);
                    }}
                >
                    <Icon type="sticky_note" />
                </PrimaryButton>
                <SecondaryButton $small onClick={optionsCallback}>
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
                        trackerState.connectionStatus !==
                        CONNECTION_STATUS.connected
                    }
                />
            }
        </div>
    );
};

export default MainHeader;
