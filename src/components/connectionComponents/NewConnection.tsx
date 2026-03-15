import React, { useContext, useState } from "react";
import { GhostButton, PrimaryButton } from "../shared/buttons";
import styles from "./SavedSlots.module.css";
import { Input } from "../inputs";
import ServiceContext from "../../contexts/serviceContext";

import ButtonRow from "../LayoutUtilities/ButtonRow";
import { ConnectionConfiguration } from "../../services/connector/APConnector";

const NewConnection = ({
    onClose,
    connectToServer,
    ...props
}: {
    onClose: () => void;
    connectToServer: (info: ConnectionConfiguration) => void;
}) => {
    const [connectionInfo, setConnectionInfo] = useState({
        host: "archipelago.gg",
        port: "",
        slot_name: "",
        password: "",
    });

    const defaultChangeHandler = (event) => {
        setConnectionInfo({
            ...connectionInfo,
            [event.target.name]: event.target.value,
        });
    };
    const serviceContext = useContext(ServiceContext);
    const connector = serviceContext.connector;
    let disabled = false;
    if (
        !connector ||
        false
        //connector.connection.status !== CONNECTION_STATUS.disconnected
    ) {
        disabled = true;
    }

    return (
        <div className={styles.new_slot_panel} {...props}>
            <h2>New Slot</h2>
            <Input
                type="text"
                name="host"
                value={connectionInfo.host}
                onChange={defaultChangeHandler}
                label="Host"
                disabled={disabled}
            />
            <Input
                type="text"
                name="port"
                value={connectionInfo.port}
                onChange={defaultChangeHandler}
                label="Port"
                disabled={disabled}
            />
            <Input
                type="text"
                name="slot_name"
                value={connectionInfo.slot_name}
                onChange={defaultChangeHandler}
                label="Slot"
                disabled={disabled}
            />
            <Input
                type="password"
                name="password"
                value={connectionInfo.password}
                onChange={defaultChangeHandler}
                label="Password"
                disabled={disabled}
            />
            <ButtonRow>
                <PrimaryButton
                    onClick={() => {
                        connectToServer(connectionInfo);
                    }}
                    disabled={disabled}
                >
                    Connect
                </PrimaryButton>
                {onClose && <GhostButton onClick={onClose}>Close</GhostButton>}
            </ButtonRow>
        </div>
    );
};

export default NewConnection;
