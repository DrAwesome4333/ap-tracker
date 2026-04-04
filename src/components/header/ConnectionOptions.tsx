import {
    DangerButton,
    GhostButton,
    PrimaryButton,
    SecondaryButton,
} from "../shared/buttons";
import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { useContext } from "react";
import ServiceContext from "../../contexts/serviceContext";
import useCurrentMultiworldSlot from "../../hooks/useCurrentMultiworldSlot";
import {
    useActivityContext,
    useCurrentActivity,
} from "../../hooks/activityHook";
import ActivityContext from "../../contexts/activityContext";
import { useAPConnectionStatus } from "../../hooks/connectionStatusHook";

const ConnectionOptions = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const connector = services.connector;
    const connectionStatus = useAPConnectionStatus();

    const loadedSlot = useCurrentMultiworldSlot();
    const canConnect = connectionStatus.disconnected && loadedSlot;
    const currentPage = useCurrentActivity();
    const activityContext = useContext(ActivityContext);

    const disconnect = () => {
        activityContext.drop();
        connector.disconnect();
    };

    return (
        <Modal open={open}>
            <div
                style={{ display: "flex", flexDirection: "column", gap: "1em" }}
            >
                <div>Status: {connectionStatus.status}</div>
                <div>Title: {loadedSlot?.title}</div>
                <div>
                    Slot: {loadedSlot?.slot_alias ?? loadedSlot?.slot_name}
                </div>
                <div>Game: {loadedSlot?.game}</div>
                <ButtonRow>
                    {connectionStatus.connected && (
                        <DangerButton onClick={disconnect}>
                            Disconnect
                        </DangerButton>
                    )}
                    {canConnect && (
                        <PrimaryButton
                            onClick={() => {
                                activityContext.add("slot-tracker");
                                connector.connect({ multi_slot: loadedSlot });
                            }}
                        >
                            Reconnect
                        </PrimaryButton>
                    )}
                    {currentPage === "slot-tracker" &&
                        connectionStatus.disconnected && (
                            <SecondaryButton
                                onClick={() => activityContext.drop()}
                            >
                                Back to Start
                            </SecondaryButton>
                        )}
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            </div>
        </Modal>
    );
};

export default ConnectionOptions;
