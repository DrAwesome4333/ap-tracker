import {
    DangerButton,
    GhostButton,
    PrimaryButton,
    SecondaryButton,
} from "../shared/buttons";
import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import useAPConnection from "../../hooks/useAPConnection";
import { useActionState, useContext } from "react";
import ServiceContext from "../../contexts/serviceContext";
import useCurrentMultiworldSlot from "../../hooks/useCurrentMultiworldSlot";
import {
    useActivityContext,
    useCurrentActivity,
} from "../../hooks/activityHook";
import ActivityContext from "../../contexts/activityContext";

const ConnectionOptions = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const connector = services.connector;
    const connection = {};
    const loadedSlot = useCurrentMultiworldSlot();
    const canConnect = true; //connection.disconnected && loadedSlot;
    const currentPage = useCurrentActivity();
    const activityContext = useContext(ActivityContext);
    return (
        <Modal open={open}>
            <div
                style={{ display: "flex", flexDirection: "column", gap: "1em" }}
            >
                <div>{connection.status}</div>
                <div>{loadedSlot?.title}</div>
                <div>{loadedSlot?.slot_alias ?? loadedSlot?.slot_name}</div>
                <div>{loadedSlot?.game}</div>
                <ButtonRow>
                    {connection.connected && (
                        <DangerButton onClick={connector.disconnect}>
                            Disconnect
                        </DangerButton>
                    )}
                    {canConnect && (
                        <PrimaryButton
                            onClick={() =>
                                connector.connect({ multi_slot: loadedSlot })
                            }
                        >
                            Reconnect
                        </PrimaryButton>
                    )}
                    {currentPage === "slot-tracker" &&
                        connection.disconnected && (
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
