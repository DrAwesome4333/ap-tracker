import { useContext } from "react";
import Modal from "@/components/shared/Modal";
import ChecklistSettings from "@/components/optionsComponents/ChecklistSettings";
import ButtonRow from "@/components/LayoutUtilities/ButtonRow";
import { GhostButton } from "@/components/shared/buttons";
import TrackerDropdown from "@/components/optionsComponents/TrackerDropdown";
import { ResourceType } from "@/services/tracker/resourceEnums";
import HintSettings from "@/components/optionsComponents/HintTagSettings";
import ServiceContext from "@/contexts/serviceContext";
import SlotContext from "@/contexts/slotContext";

const DropdownFilterModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const slotContext = useContext(SlotContext);

    return (
        <Modal
            open={open}
            header={<h3>Location Dropdown Settings</h3>}
            footer={
                <ButtonRow>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            }
        >
            Tracker: &nbsp;
            <TrackerDropdown
                game={slotContext?.game}
                type={ResourceType.locationTracker}
            />
            <br />
            <br />
            <ChecklistSettings optionManager={services.optionManager} />
            <br />
            <br />
            <HintSettings />
        </Modal>
    );
};

export default DropdownFilterModal;
