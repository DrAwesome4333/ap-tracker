import React from "react";
import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { GhostButton } from "../buttons";
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
                <ButtonRow>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            </div>
        </Modal>
    );
};

export default TextClientFilterModal;
