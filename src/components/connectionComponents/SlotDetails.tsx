import React, { useEffect, useState } from "react";
import MultiWorldContext, {
    SavedMultiWorldDetails,
    SavedSlotDetails,
} from "../../services/MultiInfo/MultiWorldContext";
import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { DangerButton, GhostButton, PrimaryButton } from "../shared/buttons";
import { Input } from "../inputs";

/** Shows information about the slot */
const SlotDetails = ({
    slot,
    connectionId,
    onClose,
}: {
    slot?: SavedSlotDetails;
    connectionId?: string;
    onClose: () => void;
}) => {
    const open = (slot || connectionId) && true;
    let multiWorld: SavedMultiWorldDetails = null;

    if (slot) {
        multiWorld = MultiWorldContext.getMultiWorld(slot.multi_save_id);
    }

    const [title, setTitle] = useState(slot?.title ?? "");
    const [host, setHost] = useState(multiWorld?.connection_details.host ?? "");
    const [port, setPort] = useState(multiWorld?.connection_details.port ?? "");
    const [password, setPassword] = useState(
        multiWorld?.connection_details.password ?? ""
    );

    useEffect(() => {
        setTitle(slot?.title ?? "");
        setHost(multiWorld?.connection_details.host ?? "");
        setPort(multiWorld?.connection_details.port ?? "");
        setPassword(multiWorld?.connection_details.password ?? "");
    }, [slot, connectionId]);

    const save = () => {
        if (slot) {
            MultiWorldContext.updateSlot(slot.multi_save_id, slot.slot_number, {
                title,
            });
            MultiWorldContext.updateMultiWorld(multiWorld.multi_save_id, {
                connection_details: {
                    host,
                    port,
                    password,
                },
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
                MultiWorldContext.deleteSlot(slot);
            }
        }
        onClose();
    };
    return (
        <Modal open={open}>
            <div>
                {slot && (
                    <>
                        <h4>Slot Info:</h4>
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
                                type="text"
                                label="Slot Name"
                                value={slot.slot_name}
                                disabled
                            />
                        </div>
                        <h4>Multi-world Info</h4>
                        <div>
                            <Input
                                type="text"
                                label="Seed Name"
                                value={multiWorld.seed_name}
                                disabled
                            />
                        </div>
                        <div>
                            <Input
                                type="text"
                                label="Host"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                type="text"
                                label="Port"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </>
                )}
            </div>
            <ButtonRow>
                <PrimaryButton onClick={save}>Save</PrimaryButton>
                <DangerButton onClick={deleteSlot}>Delete</DangerButton>
                <GhostButton onClick={onClose}>Close</GhostButton>
            </ButtonRow>
        </Modal>
    );
};

export default SlotDetails;
