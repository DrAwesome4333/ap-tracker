import {
    useCallback,
    useContext,
    useEffect,
    useEffectEvent,
    useState,
} from "react";
import NewConnection from "../connectionComponents/NewConnection";
import SavedSlotsView from "../connectionComponents/SavedSlotsView";
import styles from "./StartScreen.module.css";
import { PrimaryButton } from "../shared/buttons";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import ServiceContext from "../../contexts/serviceContext";
import ActivityContext from "../../contexts/activityContext";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import { ConnectionConfiguration } from "../../services/connector/APConnector";
import { useSearchParams } from "next/navigation";
import useOption from "../../hooks/optionHook";

let hasAttemptedAutoConnect = false;

const StartScreen = () => {
    const [newModalOpen, setNewModalOpen] = useState(false);
    const serviceContext = useContext(ServiceContext);
    const activityContext = useContext(ActivityContext);
    const params = useSearchParams();
    const putSlotInfoInUrl = useOption(
        serviceContext.optionManager,
        "Advanced:AllowSlotDetailsInUrl",
        "global"
    );
    const connector = serviceContext.connector;
    const connectToServer = useCallback(
        (connectionInfo: ConnectionConfiguration) => {
            setNewModalOpen(false);
            connector
                ?.connect(connectionInfo)
                .then((connectedEvent) => {
                    if (connectedEvent) {
                        activityContext.add("slot-tracker");
                        const newUrl = window?.location
                            ? new URL(window?.location.href)
                            : null;
                        console.log(newUrl, connectedEvent, putSlotInfoInUrl);
                        if (
                            newUrl &&
                            connectedEvent.multiWorldId &&
                            connectedEvent.slotNumber &&
                            putSlotInfoInUrl
                        ) {
                            const multiSlotCode = `${connectedEvent.multiWorldId}-${connectedEvent.slotNumber}`;
                            newUrl.searchParams.set(
                                "multi-slot",
                                multiSlotCode
                            );
                            window.history.replaceState(null, null, newUrl);
                        }
                    }
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
        [serviceContext]
    );

    const autoConnect = useEffectEvent(() => {
        const newUrl = window?.location ? new URL(window?.location.href) : null;
        if (newUrl) {
            newUrl.searchParams.delete("port");
            newUrl.searchParams.delete("slot");
            newUrl.searchParams.delete("room");
            newUrl.searchParams.delete("host");
            newUrl.searchParams.delete("password");
            // multi slot intentionally excluded from removal
            window.history.replaceState(null, null, newUrl);
        }
        const args = {
            slot: params.get("slot"),
            port: params.get("port"),
            room: params.get("room"),
            host: params.get("host"),
            multiSlot: params.get("multi-slot"),
            password: params.get("password") ?? "",
        };

        if (args.multiSlot) {
            const parts = args.multiSlot.split("-");
            if (parts.length === 2 && Number.isInteger(Number(parts[1]))) {
                connectToServer({
                    multi_slot: {
                        multi_save_id: parts[0],
                        slot_number: parseInt(parts[1]),
                    },
                });
            }
            return;
        }

        let validationErrors: string = "";
        if (!args.host && (args.port || args.room)) {
            validationErrors +=
                "\tA host parameter is required with the room or port parameter.\n";
        }
        if (args.host && !(args.port || args.room)) {
            validationErrors +=
                "\tA room or port parameter is required with the host parameter.\n";
        }
        if (args.host && !args.slot) {
            validationErrors +=
                "\tA slot parameter is required with the host parameter.\n";
        }

        if (validationErrors) {
            NotificationManager.createToast({
                message: "Invalid parameters",
                type: MessageType.warning,
                details:
                    "There were missing parameters to auto connect.\n\n" +
                    validationErrors,
            });
            return;
        }

        if (args.host && args.room) {
            connectToServer({
                room_url: args.room,
                host: args.host,
                password: args.password,
                slot_name: args.slot,
            });
        } else if (args.host && args.port) {
            connectToServer({
                port: args.port,
                host: args.host,
                password: args.password,
                slot_name: args.slot,
            });
        }
    });

    useEffect(() => {
        if (
            (params.has("slot") ||
                params.has("host") ||
                params.has("multi-slot")) &&
            !hasAttemptedAutoConnect
        ) {
            autoConnect();
        }
        hasAttemptedAutoConnect = true;
    });

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
            }}
        >
            <div className={styles.start_screen}>
                <SavedSlotsView connectToServer={connectToServer} />
                <ButtonRow>
                    <PrimaryButton
                        style={{ fontWeight: "bold" }}
                        onClick={() => setNewModalOpen(true)}
                    >
                        Add Slot
                    </PrimaryButton>
                </ButtonRow>
                <NewConnection
                    modalOpen={newModalOpen}
                    onClose={() => setNewModalOpen(false)}
                    connectToServer={connectToServer}
                />
            </div>
        </div>
    );
};

export default StartScreen;
