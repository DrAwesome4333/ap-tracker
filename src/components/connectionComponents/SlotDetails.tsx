import React, { useEffect, useState } from "react";
import MultiWorldContext, {
    SavedMultiWorldDetails,
    SavedSlotDetails,
} from "../../services/MultiInfo/MultiWorldContext";
import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { DangerButton, GhostButton, PrimaryButton } from "../shared/buttons";
import { Input } from "../inputs";
import Spinner from "../icons/spinner";
import WebHostAPIHandler from "../../services/WebHostAPI";
import Link from "next/link";

/** Shows information about the slot */
const SlotDetails = ({
    slot,
    onClose,
}: {
    slot?: SavedSlotDetails;
    onClose: () => void;
}) => {
    const open = slot && true;
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
    const [multiColor, setMultiColor] = useState(
        multiWorld?.color ?? "#888888"
    );
    const [slotColor, setSlotColor] = useState(slot?.color ?? "#888888");
    const [validatingRoom, setValidatingRoom] = useState<boolean>(false);
    const room = multiWorld?.room_details;
    const roomConfigured =
        multiWorld?.room_details &&
        multiWorld?.room_details.tracker_suuid &&
        true;
    const [roomLink, setRoomLink] = useState<string>("");
    const [lastRoomError, setLastRoomError] = useState<string>("");

    useEffect(() => {
        setTitle(slot?.title ?? "");
        setHost(multiWorld?.connection_details.host ?? "");
        setPort(multiWorld?.connection_details.port ?? "");
        setPassword(multiWorld?.connection_details.password ?? "");
        setSlotColor(slot?.color ?? "#888888");
        setMultiColor(multiWorld?.color ?? "#888888");
    }, [slot, multiWorld]);

    const save = () => {
        if (slot) {
            MultiWorldContext.updateSlot(slot.multi_save_id, slot.slot_number, {
                color: slotColor,
                title,
            });
            MultiWorldContext.updateMultiWorld(multiWorld.multi_save_id, {
                color: multiColor,
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

    const updateRoomInfoFromLink = async () => {
        setLastRoomError("");
        setValidatingRoom(true);
        await WebHostAPIHandler.parseRoomLink(roomLink)
            .then((roomInfo) => {
                const handler = new WebHostAPIHandler(roomInfo);
                MultiWorldContext.updateMultiWorld(multiWorld.multi_save_id, {
                    room_details: roomInfo,
                });
                setRoomLink("");
            })
            .catch((e: Error) => {
                if (e.cause === "validation" || e.cause === "verification") {
                    setLastRoomError(e.message);
                } else {
                    setLastRoomError(
                        `An error occurred verifying room info. Error: ${e}`
                    );
                }
            });

        setValidatingRoom(false);
    };

    const removeRoom = () => {
        MultiWorldContext.updateMultiWorld(multiWorld.multi_save_id, {
            room_details: null,
        });
        setRoomLink("");
    };

    return (
        <Modal
            open={open}
            header={<h3>Details:</h3>}
            footer={
                <ButtonRow>
                    <PrimaryButton
                        onClick={save}
                        disabled={!!roomLink || validatingRoom}
                    >
                        Save
                    </PrimaryButton>
                    <DangerButton
                        onClick={deleteSlot}
                        disabled={validatingRoom}
                    >
                        Delete
                    </DangerButton>
                    <GhostButton onClick={onClose} disabled={validatingRoom}>
                        Close
                    </GhostButton>
                </ButtonRow>
            }
        >
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
                        <div>
                            <Input
                                type="color"
                                label="Color"
                                value={slotColor}
                                onChange={(e) => setSlotColor(e.target.value)}
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
                        <div>
                            <Input
                                type="color"
                                label="Color"
                                value={multiColor}
                                onChange={(e) => setMultiColor(e.target.value)}
                            />
                        </div>
                        <h4>Room</h4>
                        <div>
                            <p>
                                Room link is{" "}
                                {roomConfigured
                                    ? "configured"
                                    : "not configured"}
                                .{" "}
                                {roomConfigured && (
                                    <Link
                                        target="blank"
                                        href={`${room?.origin}/room/${room.room_suuid}`}
                                    >
                                        Open Room
                                    </Link>
                                )}
                            </p>
                        </div>
                        <div>
                            {roomConfigured && roomLink && (
                                <p>Unsaved room changes.</p>
                            )}

                            <Input
                                type="text"
                                label="Room link"
                                value={roomLink}
                                onChange={(e) => {
                                    setRoomLink(e.target.value);
                                    setLastRoomError("");
                                }}
                            />
                            <ButtonRow>
                                <PrimaryButton
                                    disabled={!roomLink || validatingRoom}
                                    onClick={updateRoomInfoFromLink}
                                >
                                    {validatingRoom ? (
                                        <Spinner style={{ height: "18px" }} />
                                    ) : roomConfigured ? (
                                        "Change Room"
                                    ) : (
                                        "Add Room"
                                    )}
                                </PrimaryButton>
                                {roomConfigured && (
                                    <DangerButton
                                        disabled={validatingRoom}
                                        onClick={removeRoom}
                                    >
                                        Remove Room
                                    </DangerButton>
                                )}
                            </ButtonRow>
                            {!!lastRoomError && <p>Error: {lastRoomError}</p>}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SlotDetails;
