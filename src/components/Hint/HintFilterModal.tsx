import * as HintOptionDef from "./HintOptionDef";
import Modal from "../shared/Modal";
import React from "react";
import OptionView from "../optionsComponents/OptionView";
import { globalOptionManager } from "../../services/options/optionManager";
import { GhostButton } from "../buttons";

const HintFilterModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    return (
        <Modal open={open}>
            <OptionView
                option={HintOptionDef.optionDef}
                onUpdate={(name, value) => {
                    globalOptionManager.setOptionValue(
                        name,
                        HintOptionDef.optionScope,
                        value
                    );
                }}
            />
            <GhostButton onClick={onClose}>Close</GhostButton>
        </Modal>
    );
};

export default HintFilterModal;
