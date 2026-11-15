import { useContext, useSyncExternalStore } from "react";
import Modal from "@/components/shared/Modal";
import InventorySettings from "@/components/optionsComponents/InventorySettings";
import ButtonRow from "@/components/LayoutUtilities/ButtonRow";
import { GhostButton } from "@/components/shared/buttons";
import OptionView from "@/components/optionsComponents/OptionView";
import TrackerDropdown from "@/components/optionsComponents/TrackerDropdown";
import ServiceContext from "@/contexts/serviceContext";
import SlotContext from "@/contexts/slotContext";
import { ResourceType } from "@/services/tracker/resourceEnums";
import { JSONValue } from "@/services/dataStores";
const InventoryFilterOptionsModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const slotContext = useContext(SlotContext);
    const itemTracker = slotContext.itemTracker;
    const optionManger = services.optionManager;
    const options = useSyncExternalStore(
        itemTracker
            ? itemTracker.getUpdateSubscriber()
            : () => {
                  return () => {};
              },
        () => itemTracker?.options,
        () => itemTracker?.options
    );
    const optionUpdate = (optionName: string, value: JSONValue) => {
        optionManger.setOptionValue(optionName, "global", value);
    };

    return (
        <Modal
            open={open}
            header={<h3>Inventory Settings</h3>}
            footer={
                <ButtonRow>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            }
        >
            Tracker: &nbsp;
            <TrackerDropdown
                game={slotContext.game}
                type={ResourceType.itemTracker}
            />
            <br />
            <br />
            <h3>Inventory Filters</h3>
            <div>
                <InventorySettings />
                {options &&
                    Object.entries(options).map(([name, option]) => (
                        <OptionView
                            key={name}
                            option={option}
                            onUpdate={optionUpdate}
                        />
                    ))}
            </div>
        </Modal>
    );
};

export default InventoryFilterOptionsModal;
