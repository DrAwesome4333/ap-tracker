import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { GhostButton } from "../shared/buttons";
import OptionView from "../optionsComponents/OptionView";
import { baseTrackerOptions } from "../../services/options/trackerOptions";

const TextClientFilterModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    return (
        <Modal
            open={open}
            header={<h3>Text Client Settings</h3>}
            footer={
                <ButtonRow>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            }
        >
            <div>
                <OptionView
                    option={baseTrackerOptions["TextClient:message_filter"]}
                />
                <h3> Other Settings</h3>
                <OptionView
                    option={baseTrackerOptions["TextClient:DoubleClickToCopy"]}
                />
                <OptionView
                    option={
                        baseTrackerOptions["TextClient:IncludeMyOtherSlots"]
                    }
                />
            </div>
        </Modal>
    );
};

export default TextClientFilterModal;
