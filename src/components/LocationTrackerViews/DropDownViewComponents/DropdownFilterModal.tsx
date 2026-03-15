import React, { useContext } from "react";
import Modal from "../../shared/Modal";
import ChecklistSettings from "../../optionsComponents/ChecklistSettings";
import ServiceContext from "../../../contexts/serviceContext";
import ButtonRow from "../../LayoutUtilities/ButtonRow";
import { GhostButton } from "../../shared/buttons";
import TrackerDropdown from "../../optionsComponents/TrackerDropdown";
import { ResourceType } from "../../../services/tracker/resourceEnums";
import HintSettings from "../../optionsComponents/HintTagSettings";
import useCurrentMultiworldSlot from "../../../hooks/useCurrentMultiworldSlot";

const DropdownFilterModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const slot = useCurrentMultiworldSlot();

    return (
        <Modal open={open}>
            <h2>Location Dropdown Settings</h2>
            Tracker: &nbsp;
            <TrackerDropdown
                game={slot.game}
                type={ResourceType.locationTracker}
            />
            <br />
            <br />
            <ChecklistSettings optionManager={services.optionManager} />
            <br />
            <br />
            <HintSettings />
            <ButtonRow>
                <GhostButton onClick={onClose}>Close</GhostButton>
            </ButtonRow>
        </Modal>
    );
};

export default DropdownFilterModal;
