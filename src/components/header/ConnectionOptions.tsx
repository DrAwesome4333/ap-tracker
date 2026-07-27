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
import { useCurrentActivity } from "../../hooks/activityHook";
import ActivityContext from "../../contexts/activityContext";
import { useAPConnectionStatus } from "../../hooks/connectionStatusHook";
import SlotContext from "../../contexts/slotContext";

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
    const currentPage = useCurrentActivity();

    const slotContext = useContext(SlotContext);

    const canConnect = connectionStatus.disconnected && slotContext.liveSlot;
    const activityContext = useContext(ActivityContext);

    const disconnect = () => {
        activityContext.drop();
        connector.disconnect();
    };

    return (
        <Modal
            open={open}
            header={"World Info"}
            footer={
                <ButtonRow>
                    {connectionStatus.connected && (
                        <DangerButton onClick={disconnect}>
                            Disconnect
                        </DangerButton>
                    )}
                    {canConnect &&
                        !currentPage?.startsWith("multi-world-tracker") && (
                            <PrimaryButton
                                onClick={() => {
                                    activityContext.add("slot-tracker");
                                    connector.connect({
                                        multi_slot: {
                                            multi_save_id:
                                                slotContext.multiWorldId,
                                            slot_number: slotContext.slotNumber,
                                        },
                                    });
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
                    {currentPage?.startsWith("multi-world-tracker") && (
                        <SecondaryButton onClick={() => activityContext.drop()}>
                            Back to Start
                        </SecondaryButton>
                    )}
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            }
        >
            <div
                style={{ display: "flex", flexDirection: "column", gap: "1em" }}
            >
                <div>Status: {connectionStatus.status}</div>
                <div>More stuff to come soon</div>
            </div>
        </Modal>
    );
};

export default ConnectionOptions;
