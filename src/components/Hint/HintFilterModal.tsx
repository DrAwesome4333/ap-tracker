import * as HintOptionDef from "./HintOptionDef";
import Modal from "../shared/Modal";
import React from "react";
import OptionView from "../optionsComponents/OptionView";
import { globalOptionManager } from "../../services/options/optionManager";
import { GhostButton } from "../shared/buttons";
import ButtonRow from "../LayoutUtilities/ButtonRow";

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
            <ButtonRow>
                <GhostButton onClick={onClose}>Close</GhostButton>
            </ButtonRow>
        </Modal>
    );
};

export default HintFilterModal;
