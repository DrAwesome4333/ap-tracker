import React, {
    useCallback,
    useContext,
    useState,
    useSyncExternalStore,
} from "react";
import SavedConnectionView from "./SavedConnectionView";
import ServiceContext from "../../contexts/serviceContext";
import { TrackerStateContext } from "../../contexts/contexts";
import { CONNECTION_STATUS } from "../../services/connector/connector";
import SlotDetails from "./SlotDetails";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import SavedConnectionManager, {
    SavedConnection,
} from "../../services/savedConnections/savedConnectionManager";
import MultiWorldContext, {
    SavedSlotDetails,
} from "../../services/MultiInfo/MultiWorldContext";
import SavedSlotView from "./SavedSlotView";
import Icon from "../icons/icons";
import styles from "./SavedSlots.module.css";

const SavedConnections = ({ ...props }) => {
    const trackerState = useContext(TrackerStateContext);
    const [editorSlot, setEditorSlot] = useState<SavedSlotDetails>(null);
    const [editorConnection, setEditorConnection] = useState<string>(null);

    const legacyConnectionData = useSyncExternalStore(
        SavedConnectionManager.getSubscriberCallback(),
        () => SavedConnectionManager.loadSavedConnectionData(),
        () => SavedConnectionManager.loadSavedConnectionData()
    );
    const allLegacyConnections: SavedConnection[] = [];
    const legacyConnectionIds = Object.getOwnPropertyNames(
        legacyConnectionData.connections
    );

    const serviceContext = useContext(ServiceContext);
    const connector = serviceContext.connector;
    let disabled = false;
    if (
        !connector ||
        trackerState.connectionStatus !== CONNECTION_STATUS.disconnected
    ) {
        disabled = true;
    }

    for (const key of legacyConnectionIds) {
        allLegacyConnections.push(legacyConnectionData.connections[key]);
    }
    const sortedLegacyConnections = allLegacyConnections.filter(
        (x) => !x.migrated
    );
    sortedLegacyConnections.sort((a, b) => b.lastUsedTime - a.lastUsedTime);

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
        ({
            slot,
            connectionId,
        }: {
            slot?: SavedSlotDetails;
            connectionId?: string;
        }) => {
            connector
                .connectToAP({
                    legacy_connection_id: connectionId,
                    multi_slot: slot && {
                        multi_save_id: slot.multi_save_id,
                        slot_number: slot.slot_number,
                    },
                })
                .catch((result) => {
                    if (result instanceof Error) {
                        console.error(result);
                        NotificationManager.createToast({
                            type: MessageType.error,
                            message: `An unexpected error occurred: ${result.name}`,
                            details: `${result.message}\n${result.stack}`,
                            duration: 30,
                        });
                    } else {
                        NotificationManager.createToast({
                            ...result,
                        });
                    }
                });
        },
        []
    );

    return (
        <div className={styles.slots} {...props}>
            <h2>Saved Slots</h2>
            <div className={styles.slot_list}>
                {slots.length > 0 &&
                    slots.map((slot) => (
                        <SavedSlotView
                            key={`${slot.multi_save_id}_${slot.slot_number}`}
                            slot={slot}
                            connect={() => onConnect({ slot })}
                            edit={() => {
                                setEditorSlot(slot);
                                setEditorConnection(null);
                            }}
                            disabled={disabled}
                        />
                    ))}
                {sortedLegacyConnections.length > 0 && (
                    <>
                        {sortedLegacyConnections.map((connection) => (
                            <SavedConnectionView
                                key={connection.connectionId}
                                {...connection}
                                disabled={disabled}
                                connect={() =>
                                    onConnect({
                                        connectionId: connection.connectionId,
                                    })
                                }
                                edit={() => {
                                    setEditorSlot(null);
                                    setEditorConnection(
                                        connection.connectionId
                                    );
                                }}
                            />
                        ))}
                    </>
                )}
                {sortedLegacyConnections.length === 0 && slots.length === 0 && (
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
            <div
                style={{
                    marginTop: "1em",
                    maxWidth: "80%",
                    textAlign: "center",
                }}
            >
                {sortedLegacyConnections.length > 0 && (
                    <>
                        <Icon
                            type="warning"
                            style={{ color: "orange" }}
                            iconParams={{ fill: 0 }}
                        />{" "}
                        Slots need updating, connect to server to update them.
                    </>
                )}
            </div>
            <SlotDetails
                slot={editorSlot}
                connectionId={editorConnection}
                onClose={() => {
                    setEditorSlot(null);
                    setEditorConnection(null);
                }}
            />
        </div>
    );
};

export default SavedConnections;
