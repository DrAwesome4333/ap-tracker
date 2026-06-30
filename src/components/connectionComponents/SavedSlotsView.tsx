import React, { useCallback, useState, useSyncExternalStore } from "react";
import SlotDetails from "./SlotDetails";
import MultiWorldContext, {
    SavedSlotDetails,
} from "../../services/MultiInfo/MultiWorldContext";
import SavedSlotView from "./SavedSlotView";
import styles from "./SavedSlots.module.css";
import { ConnectionConfiguration } from "../../services/connector/APConnector";
import { useAPConnectionStatus } from "../../hooks/connectionStatusHook";

const SavedSlotsView = ({
    connectToServer,
    ...props
}: {
    connectToServer: (info: ConnectionConfiguration) => void;
}) => {
    const [editorSlot, setEditorSlot] = useState<SavedSlotDetails>(null);
    const connectionStatus = useAPConnectionStatus();
    const disabled = !connectionStatus.disconnected;

    const multiSlots = useSyncExternalStore(
        MultiWorldContext.addUpdateCallback,
        MultiWorldContext.getAllMultiWorldsWithSlots,
        MultiWorldContext.getAllMultiWorldsWithSlots
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
                        <div>{multiWorld.title}</div>
                        {multiWorld.slots.map((slot) => (
                            <SavedSlotView
                                key={`${slot.multi_save_id}_${slot.slot_number}`}
                                slot={slot}
                                multiWorld={multiWorld}
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
                onClose={() => {
                    setEditorSlot(null);
                }}
            />
        </div>
    );
};

export default SavedSlotsView;
