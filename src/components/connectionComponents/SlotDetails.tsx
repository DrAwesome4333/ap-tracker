import React, { useEffect, useState } from "react";
import MultiWorldContext, {
    SavedMultiWorldDetails,
    SavedSlotDetails,
} from "../../services/MultiInfo/MultiWorldContext";
import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { DangerButton, GhostButton, PrimaryButton } from "../shared/buttons";
import SavedConnectionManager, {
    SavedConnection,
} from "../../services/savedConnections/savedConnectionManager";
import { Input } from "../inputs";
import Icon from "../icons/icons";

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
    const isLegacyConnection = connectionId && !slot;
    let legacyDetails: SavedConnection = null;
    let multiWorld: SavedMultiWorldDetails = null;

    if (connectionId) {
        legacyDetails =
            SavedConnectionManager.loadSavedConnectionData().connections[
                connectionId
            ];
    }

    if (slot) {
        multiWorld = MultiWorldContext.getMultiWorld(slot.multi_save_id);
    }

    const [title, setTitle] = useState(
        slot?.title ?? legacyDetails?.name ?? ""
    );
    const [host, setHost] = useState(
        multiWorld?.connection_details.host ?? legacyDetails?.host ?? ""
    );
    const [port, setPort] = useState(
        multiWorld?.connection_details.port ?? legacyDetails?.port ?? ""
    );
    const [password, setPassword] = useState(
        multiWorld?.connection_details.password ?? legacyDetails?.password ?? ""
    );

    useEffect(() => {
        setTitle(slot?.title ?? legacyDetails?.name ?? "");
        setHost(
            multiWorld?.connection_details.host ?? legacyDetails?.host ?? ""
        );
        setPort(
            multiWorld?.connection_details.port ?? legacyDetails?.port ?? ""
        );
        setPassword(
            multiWorld?.connection_details.password ??
                legacyDetails?.password ??
                ""
        );
    }, [slot, connectionId]);

    const save = () => {
        if (isLegacyConnection) {
            SavedConnectionManager.saveConnectionData({
                ...legacyDetails,
                name: title,
                password,
                host,
                port,
            });
        } else if (slot) {
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
            `Are you sure you want to delete ${slot?.title ?? legacyDetails?.name}?`
        );
        if (result) {
            if (legacyDetails) {
                SavedConnectionManager.deleteConnection(connectionId);
            }
            if (slot) {
                MultiWorldContext.deleteSlot(slot);
            }
        }
        onClose();
    };
    return (
        <Modal open={open}>
            <div>
                {slot && !isLegacyConnection && (
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
                {isLegacyConnection && (
                    <>
                        <div>
                            <Icon
                                type="warning"
                                style={{ color: "orange" }}
                                iconParams={{ fill: 0 }}
                            />{" "}
                            Please connect this slot to the Multi-world server
                            to update it.{" "}
                        </div>
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
                                value={legacyDetails.slot}
                                disabled
                            />
                        </div>
                        <div>
                            <Input
                                type="text"
                                label="Seed Name"
                                value={legacyDetails.seed}
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
