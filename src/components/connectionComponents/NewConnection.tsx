import { KeyboardEventHandler, useState } from "react";
import { GhostButton, PrimaryButton } from "../shared/buttons";
import styles from "./SavedSlots.module.css";
import { Input } from "../inputs";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { ConnectionConfiguration } from "../../services/connector/APConnector";
import { useAPConnectionStatus } from "../../hooks/connectionStatusHook";
import Modal from "../shared/Modal";

const NewConnection = ({
    onClose,
    connectToServer,
    modalOpen,
    ...props
}: {
    onClose: () => void;
    connectToServer: (info: ConnectionConfiguration) => void;
    modalOpen: boolean;
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

    const submitOnEnter: KeyboardEventHandler = (event) => {
        if (event.key === "Enter") {
            connectToServer(connectionInfo);
        }
    };

    const connectionStatus = useAPConnectionStatus();
    const disabled = !connectionStatus.disconnected;

    return (
        <Modal
            open={modalOpen}
            header={<h3>New Slot</h3>}
            footer={
                <ButtonRow>
                    <PrimaryButton
                        onClick={() => {
                            connectToServer(connectionInfo);
                        }}
                        disabled={disabled}
                    >
                        Connect
                    </PrimaryButton>
                    {onClose && (
                        <GhostButton onClick={onClose}>Close</GhostButton>
                    )}
                </ButtonRow>
            }
        >
            <div className={styles.new_slot_panel} {...props}>
                <Input
                    type="text"
                    name="host"
                    value={connectionInfo.host}
                    onChange={defaultChangeHandler}
                    onKeyUpCapture={submitOnEnter}
                    label="Host"
                    disabled={disabled}
                />
                <Input
                    type="text"
                    name="port"
                    value={connectionInfo.port}
                    onChange={defaultChangeHandler}
                    onKeyUpCapture={submitOnEnter}
                    label="Port"
                    placeholder="38281"
                    disabled={disabled}
                />
                <Input
                    type="text"
                    name="slot_name"
                    value={connectionInfo.slot_name}
                    onChange={defaultChangeHandler}
                    onKeyUpCapture={submitOnEnter}
                    label="Slot"
                    disabled={disabled}
                />
                <Input
                    type="password"
                    name="password"
                    value={connectionInfo.password}
                    onChange={defaultChangeHandler}
                    onKeyUpCapture={submitOnEnter}
                    label="Password"
                    disabled={disabled}
                />
            </div>
        </Modal>
    );
};

export default NewConnection;
