import { useEffect, useState } from "react";
import MultiWorldService from "../../services/MultiInfo/MultiWorldService";
import WebHostAPIHandler from "../../services/WebHostAPI";
import Modal from "../shared/Modal";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { DangerButton, GhostButton, PrimaryButton } from "../shared/buttons";
import { Input } from "../inputs";
import Link from "next/link";
import Spinner from "../icons/spinner";

const MultiWorldDetails = ({
    multiSaveId,
    onClose,
}: {
    multiSaveId?: string;
    onClose: () => void;
}) => {
    const open = !!multiSaveId;
    const multiWorld = open
        ? MultiWorldService.getMultiWorld(multiSaveId)
        : null;
    const [title, setTitle] = useState<string>(multiWorld?.title ?? "");
    const [host, setHost] = useState<string>(
        multiWorld?.connection_details.host ?? ""
    );
    const [port, setPort] = useState<string>(
        multiWorld?.connection_details.port ?? ""
    );
    const [password, setPassword] = useState<string>(
        multiWorld?.connection_details.password ?? ""
    );
    const [color, setColor] = useState<string>(multiWorld?.color ?? "#888888");
    const [validatingRoom, setValidatingRoom] = useState<boolean>(false);
    const room = multiWorld?.room_details;
    const roomConfigured =
        multiWorld?.room_details &&
        multiWorld?.room_details.tracker_suuid &&
        true;
    const [roomLink, setRoomLink] = useState<string>("");
    const [lastRoomError, setLastRoomError] = useState<string>("");

    useEffect(() => {
        setTitle(multiWorld?.title ?? "");
        setHost(multiWorld?.connection_details.host ?? "");
        setPort(multiWorld?.connection_details.port ?? "");
        setPassword(multiWorld?.connection_details.password ?? "");
        setColor(multiWorld?.color ?? "#888888");
    }, [multiWorld]);

    const save = () => {
        if (!multiWorld?.multi_save_id) {
            return;
        }
        MultiWorldService.updateMultiWorld(multiWorld.multi_save_id, {
            color,
            title,
            connection_details: {
                host,
                port,
                password,
            },
        });
        onClose();
    };

    const deleteMultiWorld = () => {
        const confirmationResult = window.confirm(
            `Are you sure you want to delete ${multiWorld?.title ?? "<unknown multi-world>"}?`
        );
        if (confirmationResult && multiWorld.multi_save_id) {
            MultiWorldService.deleteMultiWorld(multiWorld.multi_save_id);
        }
        onClose();
    };

    const updateRoomInfoFromLink = async () => {
        setLastRoomError("");
        setValidatingRoom(true);
        await WebHostAPIHandler.parseRoomLink(roomLink)
            .then(async (roomInfo) => {
                const handler = new WebHostAPIHandler(roomInfo);
                const staticTracker = await handler.getStaticTracker();
                const roomStatus = await handler.getRoomStatus();
                const allSlots = MultiWorldService.findAllSlotsForMultiWorld(
                    multiWorld.multi_save_id
                );
                // validate some properties for the multi-world match
                const dataPackageCompare = (
                    a: [string, unknown],
                    b: [string, unknown]
                ) => (a[0] < b[0] ? 1 : -1);
                const currentPackages = Object.entries(
                    multiWorld.data_package_details
                );
                currentPackages.sort(dataPackageCompare);
                const roomPackages = Object.entries(staticTracker.datapackage);
                roomPackages.sort(dataPackageCompare);
                if (
                    currentPackages.length !== roomPackages.length ||
                    currentPackages.some(
                        ([_game, checksum], index) =>
                            roomPackages[index][1].checksum !== checksum
                    ) ||
                    allSlots.some(
                        (mwSlot) =>
                            roomStatus.players[mwSlot.slot_number - 1][0] !==
                                mwSlot.slot_name ||
                            roomStatus.players[mwSlot.slot_number - 1][1] !==
                                mwSlot.game
                    )
                ) {
                    throw new Error(
                        "Room does not match this slot's multi-world",
                        { cause: "verification" }
                    );
                }

                MultiWorldService.updateMultiWorld(multiWorld.multi_save_id, {
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
        MultiWorldService.updateMultiWorld(multiWorld.multi_save_id, {
            room_details: null,
        });
        setRoomLink("");
    };
    return (
        <Modal
            open={open}
            header={<h3>Multi-World Details:</h3>}
            footer={
                <ButtonRow>
                    <PrimaryButton
                        onClick={save}
                        disabled={!!roomLink || validatingRoom}
                    >
                        Save
                    </PrimaryButton>
                    <DangerButton
                        onClick={deleteMultiWorld}
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
                {multiWorld && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                        }}
                    >
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
                                label="Host"
                                value={host}
                                disabled={roomConfigured}
                                onChange={(e) => setHost(e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                type="text"
                                label="Port"
                                value={port}
                                disabled={roomConfigured}
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
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                            />
                        </div>
                        <hr style={{ width: "100%" }} />
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
                                    small
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
                                        small
                                        disabled={validatingRoom}
                                        onClick={removeRoom}
                                    >
                                        Remove Room
                                    </DangerButton>
                                )}
                            </ButtonRow>
                            {!!lastRoomError && <p>Error: {lastRoomError}</p>}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default MultiWorldDetails;
