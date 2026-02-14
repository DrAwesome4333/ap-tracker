import { useContext } from "react";
import { DangerButton } from "../shared/buttons";
import ServiceContext from "../../contexts/serviceContext";
import Modal from "../shared/Modal";

const ConnectionOptions = ({ open }: { open: boolean }) => {
    const services = useContext(ServiceContext);
    const connector = services.connector;

    return (
        <Modal open={open}>
            <div
                style={{ display: "flex", flexDirection: "column", gap: "1em" }}
            >
                <div>{connector.connection.status}</div>
                <DangerButton onClick={connector.disconnect}>
                    Disconnect
                </DangerButton>
            </div>
        </Modal>
    );
};

export default ConnectionOptions;
