// @ts-check
import React, { useContext, useState } from "react";
import { TrackerStateContext } from "../contexts/contexts";
import { PrimaryButton, SecondaryButton } from "./buttons";
import Icon from "./icons/icons";
import { background } from "../constants/colors";
import NotePad from "./NotePad";
import ServiceContext from "../contexts/serviceContext";
import { CONNECTION_STATUS } from "../services/connector/connector";

const MainHeader = ({ optionsCallback, ...props }) => {
    const trackerState = useContext(TrackerStateContext);
    const [notePadOpen, setNotePadOpen] = useState(false);
    const slot = trackerState.slotData;
    const serviceContext = useContext(ServiceContext);
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                position: "sticky",
                top: "0px",
                boxShadow: "3px 4px 0px rgba(0, 0, 0, 0.5)",
                backgroundColor: background,
            }}
        >
            <div
                style={{ width: "100%", display: "flex", columnGap: "1rem" }}
                {...props}
            >
                <div>{trackerState.connectionStatus}</div>
                {slot?.alias && <div>{slot.alias}</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <PrimaryButton
                    disabled={
                        trackerState.connectionStatus !==
                        CONNECTION_STATUS.connected
                    }
                    // @ts-ignore
                    $small
                    onClick={() => {
                        setNotePadOpen(true);
                    }}
                >
                    <Icon type="sticky_note" />
                </PrimaryButton>
                <SecondaryButton
                    // @ts-ignore
                    $small
                    onClick={optionsCallback}
                >
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
