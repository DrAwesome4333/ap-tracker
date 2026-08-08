import {
    DangerButton,
    GhostButton,
    PrimaryButton,
    SecondaryButton,
    TextButton,
} from "../shared/buttons";
import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { useContext } from "react";
import ServiceContext from "../../contexts/serviceContext";
import { useCurrentActivity } from "../../hooks/activityHook";
import ActivityContext from "../../contexts/activityContext";
import { useAPConnectionStatus } from "../../hooks/connectionStatusHook";
import SlotContext from "../../contexts/slotContext";
import MultiWorldService from "../../services/MultiInfo/MultiWorldService";
import Icon from "../icons/icons";
import { copyToClipboard } from "../../utility/clipboard";
import MultiWorldContext from "../../contexts/multiWorldContext";

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
    const multiWorldContext = useContext(MultiWorldContext);

    const canConnect =
        connectionStatus.disconnected &&
        slotContext.liveSlot &&
        slotContext.multiWorldId;
    const activityContext = useContext(ActivityContext);

    const onMultiTracker = currentPage?.startsWith("multi-world-tracker");
    const onSlotTracker = currentPage === "slot-tracker";
    const multiWorld = multiWorldContext?.multiSaveId
        ? MultiWorldService.getMultiWorld(multiWorldContext.multiSaveId)
        : null;

    const disconnect = () => {
        activityContext.drop();
        connector.disconnect();
    };

    const reconnect = () => {
        activityContext.add("slot-tracker");
        connector.connect({
            multi_slot: {
                multi_save_id: slotContext.multiWorldId,
                slot_number: slotContext.slotNumber,
            },
        });
    };

    const footer = (
        <ButtonRow>
            {onMultiTracker ? (
                <SecondaryButton
                    onClick={() => {
                        activityContext.drop();
                        onClose();
                    }}
                >
                    Exit Tracker
                </SecondaryButton>
            ) : connectionStatus.connected ? (
                <DangerButton onClick={disconnect}>Disconnect</DangerButton>
            ) : (
                <>
                    {connectionStatus.disconnected && onSlotTracker && (
                        <SecondaryButton
                            onClick={() => {
                                activityContext.drop();
                                onClose();
                            }}
                        >
                            Exit Tracker
                        </SecondaryButton>
                    )}
                    {canConnect && (
                        <PrimaryButton onClick={reconnect}>
                            Reconnect
                        </PrimaryButton>
                    )}
                </>
            )}
            <GhostButton onClick={onClose}>Close</GhostButton>
        </ButtonRow>
    );

    return (
        <Modal
            open={open}
            header={onMultiTracker ? "Multi-World info" : "Slot Info"}
            footer={footer}
        >
            <div
                style={{ display: "flex", flexDirection: "column", gap: "1em" }}
            >
                <div>
                    Status:{" "}
                    {onMultiTracker
                        ? "Passive Tracking"
                        : connectionStatus.status}
                </div>
                {!onMultiTracker && (
                    <>
                        <div>
                            Slot Name:{" "}
                            <TextButton
                                onClick={() =>
                                    copyToClipboard(slotContext?.slotName)
                                }
                            >
                                {slotContext?.slotName}{" "}
                                <Icon type="content_copy" fontSize="1rem" />
                            </TextButton>
                        </div>
                        <div>
                            Port:{" "}
                            <TextButton
                                onClick={() =>
                                    copyToClipboard(
                                        multiWorld?.connection_details.port
                                    )
                                }
                            >
                                {multiWorld?.connection_details.port}{" "}
                                <Icon type="content_copy" fontSize="1rem" />
                            </TextButton>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ConnectionOptions;
