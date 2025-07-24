import React, { useContext, useSyncExternalStore } from "react";
import Modal from "../shared/Modal";
import InventorySettings from "../optionsComponents/InventorySettings";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { GhostButton } from "../buttons";
import ServiceContext from "../../contexts/serviceContext";
import OptionView from "../optionsComponents/OptionView";
import { JSONValue } from "../../services/dataStores";
import TrackerDropdown from "../optionsComponents/TrackerDropdown";
import { ResourceType } from "../../services/tracker/resourceEnums";
const InventoryFilterOptionsModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const itemTracker = services.inventoryTracker;
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
        <Modal open={open}>
            <h2>Inventory Settings</h2>
            Tracker: &nbsp;
            <TrackerDropdown
                game={services.connector?.connection.slotInfo.game}
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
            <ButtonRow>
                <GhostButton onClick={onClose}>Close</GhostButton>
            </ButtonRow>
        </Modal>
    );
};

export default InventoryFilterOptionsModal;
