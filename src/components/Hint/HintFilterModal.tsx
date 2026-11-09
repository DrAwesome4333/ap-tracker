import * as HintOptionDef from "./HintOptionDef";
import Modal from "@/components/shared/Modal";
import OptionView from "@/components/optionsComponents/OptionView";
import { globalOptionManager } from "@/services/options/optionManager";
import { GhostButton } from "@/components/shared/buttons";
import ButtonRow from "@/components/LayoutUtilities/ButtonRow";

const HintFilterModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    return (
        <Modal
            open={open}
            header={<h3>Hint Filters</h3>}
            footer={
                <ButtonRow>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            }
        >
            <OptionView
                option={HintOptionDef.optionDef}
                hideTitle
                onUpdate={(name, value) => {
                    globalOptionManager.setOptionValue(
                        name,
                        HintOptionDef.optionScope,
                        value
                    );
                }}
            />
        </Modal>
    );
};

export default HintFilterModal;
