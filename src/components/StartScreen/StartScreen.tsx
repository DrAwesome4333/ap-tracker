import React, { useCallback, useContext, useState } from "react";
import NewConnection from "../connectionComponents/NewConnection";
import SavedConnections from "../connectionComponents/SavedConnections";
import Modal from "../shared/Modal";
import styles from "./StartScreen.module.css";
import { PrimaryButton } from "../shared/buttons";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import ServiceContext from "../../contexts/serviceContext";
import ActivityContext from "../../contexts/activityContext";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import { ConnectionConfiguration } from "../../services/connector/APConnector";

const StartScreen = () => {
    const [newModalOpen, setNewModalOpen] = useState(false);
    const serviceContext = useContext(ServiceContext);
    const activityContext = useContext(ActivityContext);
    const connector = serviceContext.connector;
    const connectToServer = useCallback(
        (connectionInfo: ConnectionConfiguration) => {
            connector
                ?.connect(connectionInfo)
                .then(() => {
                    activityContext.add("slot-tracker");
                })
                .catch((result) => {
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
        },
        [serviceContext]
    );

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
            }}
        >
            <div className={styles.start_screen}>
                <SavedConnections connectToServer={connectToServer} />
                <ButtonRow>
                    <PrimaryButton
                        style={{ fontWeight: "bold" }}
                        onClick={() => setNewModalOpen(true)}
                    >
                        Add Slot
                    </PrimaryButton>
                </ButtonRow>
                <Modal open={newModalOpen}>
                    <NewConnection
                        onClose={() => setNewModalOpen(false)}
                        connectToServer={connectToServer}
                    />
                </Modal>
            </div>
        </div>
    );
};

export default StartScreen;
