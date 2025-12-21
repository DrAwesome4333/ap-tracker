import React, { useContext, useState } from "react";
import { PrimaryButton } from "../shared/buttons";
import styles from "./SavedSlots.module.css";
import { Input } from "../inputs";
import ServiceContext from "../../contexts/serviceContext";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import { CONNECTION_STATUS } from "../../services/connector/connector";

const NewConnection = ({ ...props }) => {
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
        connector.connection.status !== CONNECTION_STATUS.disconnected
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
            <PrimaryButton
                onClick={() => {
                    connector?.connectToAP(connectionInfo).catch((result) => {
                        if (result instanceof Error) {
                            console.error(result);
                            NotificationManager.createToast({
                                type: MessageType.error,
                                message: `An unexpected error occurred: ${result.name}`,
                                details: `${result.message}\n${result.stack}`,
                                duration: 30,
                            });
                        } else {
                            NotificationManager.createToast({
                                ...result,
                            });
                        }
                    });
                }}
                disabled={disabled}
            >
                Connect
            </PrimaryButton>
        </div>
    );
};

export default NewConnection;
