import { useEffect, useState } from "react";
import MultiWorldService, {
    SavedMultiWorldDetails,
    SavedSlotDetails,
} from "../../services/MultiInfo/MultiWorldService";
import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { DangerButton, GhostButton, PrimaryButton } from "../shared/buttons";
import { Input } from "../inputs";

/** Shows information about the slot */
const SlotDetails = ({
    slot,
    onClose,
    onEditMultiWorld,
}: {
    slot?: SavedSlotDetails;
    onClose: () => void;
    onEditMultiWorld: (saveId: string) => void;
}) => {
    const open = slot && true;
    let multiWorld: SavedMultiWorldDetails = null;

    if (slot) {
        multiWorld = MultiWorldService.getMultiWorld(slot.multi_save_id);
    }

    const [title, setTitle] = useState(slot?.title ?? "");
    const [color, setColor] = useState(slot?.color ?? "#888888");

    useEffect(() => {
        setTitle(slot?.title ?? "");
        setColor(slot?.color ?? "#888888");
    }, [slot, multiWorld]);

    const save = () => {
        if (slot) {
            MultiWorldService.updateSlot(slot.multi_save_id, slot.slot_number, {
                color: color,
                title,
            });
        }
        onClose();
    };

    const deleteSlot = () => {
        const result = window.confirm(
            `Are you sure you want to delete ${slot?.title ?? "<unknown slot name>"}?`
        );
        if (result) {
            if (slot) {
                MultiWorldService.deleteSlot(slot);
            }
        }
        onClose();
    };

    return (
        <Modal
            open={open}
            header={<h3>Slot Details:</h3>}
            footer={
                <ButtonRow>
                    <PrimaryButton onClick={save}>Save</PrimaryButton>
                    <DangerButton onClick={deleteSlot}>Delete</DangerButton>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            }
        >
            <div>
                {slot && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                        }}
                    >
                        <div>
                            Slot Name:{" "}
                            <span style={{ fontStyle: "italic" }}>
                                {slot.slot_name}
                            </span>
                        </div>
                        <div>
                            <Input
                                type="text"
                                label="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                type="color"
                                label="Color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                            />
                        </div>
                        <div>
                            Last used:{" "}
                            <span style={{ fontStyle: "italic" }}>
                                {new Date(
                                    slot.last_used_timestamp
                                ).toLocaleTimeString([], {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                        <p>
                            To modify the port or room, edit the multi-world
                            details.
                        </p>
                        <ButtonRow>
                            <PrimaryButton
                                onClick={() => {
                                    save();
                                    onEditMultiWorld(slot?.multi_save_id);
                                }}
                            >
                                Save and Edit Multi-World
                            </PrimaryButton>
                        </ButtonRow>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default SlotDetails;
