import { useMemo, useState } from "react";
import MultiWorldService from "../../services/MultiInfo/MultiWorldService";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { GhostButton, PrimaryButton } from "../shared/buttons";
import Modal from "../shared/Modal";
import { Checkbox, Input } from "../inputs";

type AddMoreSlotsModalParams = {
    multiSaveId: string;
    onClose: () => void;
};
const AddMoreSlotsModal = ({
    multiSaveId,
    onClose,
}: AddMoreSlotsModalParams) => {
    const open = !!multiSaveId;
    const multiWorld = multiSaveId
        ? MultiWorldService.getMultiWorld(multiSaveId)
        : null;
    const [searchFilter, setSearchFilter] = useState<string>("");
    const slotOptions: { name: string; slot: number; game: string }[] =
        useMemo(() => {
            const slots = multiSaveId
                ? MultiWorldService.findAllSlotsForMultiWorld(multiSaveId)
                : [];
            const trackedSlots = new Set(slots.map((slot) => slot.slot_number));
            const options = multiWorld?.player_details
                ? Object.values(multiWorld.player_details).filter(
                      (player) => !trackedSlots.has(player.slot)
                  )
                : [];
            return options;
        }, [multiWorld]);

    const filteredOptions = useMemo(() => {
        if (!searchFilter) {
            return slotOptions;
        }
        const effectiveFilter = searchFilter.toLocaleLowerCase();
        return slotOptions.filter(
            (slot) =>
                slot.name.toLocaleLowerCase().includes(effectiveFilter) ||
                slot.game.toLocaleLowerCase().includes(effectiveFilter)
        );
    }, [slotOptions, searchFilter]);

    const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());

    const addSlots = () => {
        const slotsToAdd = [...selectedSlots.values()];
        slotsToAdd.forEach((slotNumber) => {
            const player = multiWorld?.player_details[slotNumber] ?? null;
            if (!player) return;
            MultiWorldService.addSlot(multiSaveId, {
                slot_name: player.name,
                slot_number: player.slot,
                game: player.game,
            });
        });
        onClose();
    };

    return (
        <Modal
            open={open}
            header={<h3>Add more slots</h3>}
            footer={
                <ButtonRow>
                    <PrimaryButton onClick={addSlots}>Add Slots</PrimaryButton>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            }
        >
            <div>
                <div
                    style={{
                        position: "sticky",
                        top: "0",
                        width: "100%",
                        boxShadow: "var(--box-shadow-small)",
                        backgroundColor: "var(--background-level-2)",
                        padding: "0.5rem",
                    }}
                >
                    <Input
                        type="text"
                        label="Filter"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                    />
                </div>
                {filteredOptions.map((player) => (
                    <div key={player.slot}>
                        <Checkbox
                            checked={selectedSlots.has(player.slot)}
                            label={player.name}
                            onChange={(e) => {
                                setSelectedSlots((oldValue) => {
                                    if (
                                        (e.target.checked &&
                                            oldValue.has(player.slot)) ||
                                        (!e.target.checked &&
                                            !oldValue.has(player.slot))
                                    ) {
                                        return oldValue;
                                    }
                                    const newValue = new Set(oldValue);
                                    if (e.target.checked) {
                                        newValue.add(player.slot);
                                    } else {
                                        newValue.delete(player.slot);
                                    }
                                    return newValue;
                                });
                            }}
                        />
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default AddMoreSlotsModal;
