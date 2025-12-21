import React from "react";
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
        <Modal open={open}>
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
                <ButtonRow>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            </div>
        </Modal>
    );
};

export default TextClientFilterModal;
