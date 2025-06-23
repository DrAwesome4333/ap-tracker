import React from "react";
import Modal from "../shared/Modal";
import InventorySettings from "../optionsComponents/InventorySettings";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { GhostButton } from "../buttons";
const InventoryFilterOptionsModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    return (
        <Modal open={open}>
            <h2>Inventory Filters</h2>
            <div>
                <InventorySettings />
            </div>
            <ButtonRow>
                <GhostButton onClick={onClose}>Close</GhostButton>
            </ButtonRow>
        </Modal>
    );
};

export default InventoryFilterOptionsModal;
