import React, {
    useCallback,
    useContext,
    useState,
    useSyncExternalStore,
} from "react";
import SlotDetails from "./SlotDetails";
import MultiWorldService, {
    SavedSlotDetails,
} from "../../services/MultiInfo/MultiWorldService";
import SavedSlotView from "./SavedSlotView";
import styles from "./SavedSlots.module.css";
import { ConnectionConfiguration } from "../../services/connector/APConnector";
import { useAPConnectionStatus } from "../../hooks/connectionStatusHook";
import { PrimaryButton, SecondaryButton } from "../shared/buttons";
import ActivityContext from "../../contexts/activityContext";
import MultiWorldDetails from "./MultiWorldDetails";
import Icon from "../icons/icons";

const SavedSlotsView = ({
    connectToServer,
    ...props
}: {
    connectToServer: (info: ConnectionConfiguration) => void;
}) => {
    const activityContext = useContext(ActivityContext);
    const [editorSlot, setEditorSlot] = useState<SavedSlotDetails>(null);
    const [editorMultiWorldId, setEditorMultiWorldId] = useState<string>(null);
    const connectionStatus = useAPConnectionStatus();
    const disabled = !connectionStatus.disconnected;

    const multiSlots = useSyncExternalStore(
        MultiWorldService.addUpdateCallback,
        MultiWorldService.getAllMultiWorldsWithSlots,
        MultiWorldService.getAllMultiWorldsWithSlots
    );

    const slots = multiSlots
        .map((multi) => multi.slots)
        .flat()
        .sort((a, b) => b.last_used_timestamp - a.last_used_timestamp);

    const onConnect = useCallback(
        ({ slot }: { slot?: SavedSlotDetails; connectionId?: string }) => {
            connectToServer({
                multi_slot: slot && {
                    multi_save_id: slot.multi_save_id,
                    slot_number: slot.slot_number,
                },
            });
        },
        [connectToServer]
    );

    const openMultiWorldTracker = (multiWorldId: string) => {
        activityContext.add(`multi-world-tracker.${multiWorldId}`);
    };

    return (
        <div className={styles.slots} {...props}>
            <h2>Saved Slots</h2>
            <div className={styles.slot_list}>
                {multiSlots.map((multiWorld) => (
                    <div
                        className={styles.saved_multi}
                        style={
                            {
                                "--multi-world-color":
                                    multiWorld.color ?? "#888888",
                            } as React.CSSProperties
                        }
                        key={multiWorld.multi_save_id}
                    >
                        <div className={styles.multi_title}>
                            <div>{multiWorld.title}</div>
                            <div>
                                {multiWorld.room_details?.tracker_suuid && (
                                    <PrimaryButton
                                        small
                                        onClick={() =>
                                            openMultiWorldTracker(
                                                multiWorld.multi_save_id
                                            )
                                        }
                                    >
                                        Track
                                    </PrimaryButton>
                                )}
                                <SecondaryButton
                                    small
                                    onClick={() =>
                                        setEditorMultiWorldId(
                                            multiWorld.multi_save_id
                                        )
                                    }
                                >
                                    <Icon
                                        type="edit"
                                        iconParams={{ fill: 0 }}
                                    />
                                </SecondaryButton>
                            </div>
                        </div>
                        {multiWorld.slots.map((slot) => (
                            <SavedSlotView
                                key={`${slot.multi_save_id}_${slot.slot_number}`}
                                slot={slot}
                                connect={() => onConnect({ slot })}
                                edit={() => {
                                    setEditorSlot(slot);
                                }}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                ))}
                {slots.length === 0 && (
                    <div
                        style={{
                            padding: "1em",
                            color: "gray",
                            textAlign: "center",
                        }}
                    >
                        <i>Add a slot and it will appear here</i>
                    </div>
                )}
            </div>
            <SlotDetails
                slot={editorSlot}
                onClose={() => setEditorSlot(null)}
                onEditMultiWorld={(saveId) => {
                    setEditorSlot(null);
                    setEditorMultiWorldId(saveId);
                }}
            />
            <MultiWorldDetails
                multiSaveId={editorMultiWorldId}
                onClose={() => setEditorMultiWorldId(null)}
            />
        </div>
    );
};

export default SavedSlotsView;
