import {
    useContext,
    useEffect,
    useEffectEvent,
    useMemo,
    useRef,
    useState,
} from "react";
import { useCurrentActivity } from "../../hooks/activityHook";
import MultiWorldService, {
    SavedSlotDetails,
} from "../../services/MultiInfo/MultiWorldService";
import WebHostSlotSource from "../../services/WebHostConnector/WebHostSlotSource";
import WebHostAPIHandler from "../../services/WebHostAPI";
import SlotTracker from "./SlotTracker";
import Spinner from "../icons/spinner";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import Tabs, { Tab } from "../LayoutUtilities/Tabs";
import { MultiWorldContextData } from "../../services/MultiInfo/MultiWorldContextData";
import MultiWorldContext, {
    MultiWorldConnectionMode,
} from "../../contexts/multiWorldContext";
import HintTab from "../Hint/HintTab";
import ServiceContext from "../../contexts/serviceContext";

const useWebHostSlots = (multiSaveId: string) => {
    const initialized = useRef(false);
    const loaded = useRef(false);
    const [refreshing, setRefreshing] = useState(false);
    const apiHandlerRef = useRef<WebHostAPIHandler>(null);
    const [multiWorldContextData, setMultiWorldContextData] =
        useState<MultiWorldContextData>(null);
    const [slotDetails, setSlotDetails] = useState<SavedSlotDetails[]>([]);
    const [hostSources, setHostSources] = useState<WebHostSlotSource[]>([]);
    const serviceContext = useContext(ServiceContext);

    const update = useEffectEvent(async () => {
        if (!loaded.current || !apiHandlerRef.current) {
            return false;
        }
        const notificationHandle = NotificationManager.createStatus({
            type: MessageType.info,
            message: "Refreshing",
            progress: -1,
        });
        await apiHandlerRef.current
            .getTracker()
            .then((apiResult) => {
                serviceContext.hintManager?.addWebHostHints(apiResult);
                hostSources.forEach((source) => source.refresh(apiResult));
            })
            .catch((e) => {
                // TODO error handling;
            });
        notificationHandle.update({
            type: MessageType.success,
            progress: 0,
            duration: 0,
        });
        return true;
    });

    const initialize = async () => {
        initialized.current = true;
        loaded.current = false;

        const multiWorld = MultiWorldService.getMultiWorld(multiSaveId);
        if (!multiWorld?.room_details) {
            return;
        }

        apiHandlerRef.current = new WebHostAPIHandler(multiWorld.room_details);
        // TODO parallelize
        const roomStatus = await apiHandlerRef.current.getRoomStatus();
        const staticTracker = await apiHandlerRef.current.getStaticTracker();
        const contextData = await WebHostAPIHandler.buildMultiWorldContext(
            roomStatus,
            staticTracker,
            multiWorld.room_details.origin
        );

        const slots = MultiWorldService.findAllSlotsForMultiWorld(multiSaveId);
        setSlotDetails(slots);
        contextData.trackedSlots = slots.map((x) => x.slot_number);
        setMultiWorldContextData(contextData);
        const sources = slots.map(
            (slot) =>
                new WebHostSlotSource(contextData, slot.game, slot.slot_number)
        );
        setHostSources(sources);
        serviceContext.hintManager?.setMultiWorldContext(contextData, true);
        loaded.current = true;
    };

    if (!initialized.current) {
        initialize();
    }

    useEffect(() => {
        update();
        const timerId = setInterval(update, 1000 * 60);
        return () => {
            clearInterval(timerId);
        };
    }, [multiSaveId, hostSources]);

    const context = useMemo(
        () => ({
            refreshing,
            multiWorldContextData,
            contexts: slotDetails.map((slot, index) => ({
                slot,
                webHostSource: hostSources[index],
            })),
        }),
        [slotDetails, hostSources, refreshing, multiWorldContextData]
    );

    return context;
};

const MultiWorldTracker = () => {
    const currentActivityName = useCurrentActivity();
    const multiWorldId = currentActivityName?.split(".")[1];
    const contexts = useWebHostSlots(multiWorldId);
    const multiWorld = MultiWorldService.getMultiWorld(multiWorldId);
    const multiWorldContext = useMemo<
        MultiWorldContextData & { connectionMode: MultiWorldConnectionMode }
    >(
        () => ({
            ...contexts.multiWorldContextData,
            multiSaveId: multiWorldId,
            connectionMode: MultiWorldConnectionMode.WebAPI,
        }),
        [contexts, multiWorldId]
    );

    const inventoryTab = useMemo(
        () =>
            new Tab(
                "Inventory",
                (
                    <div
                        style={{
                            display: "flex",
                            height: "100%",
                            width: "100%",
                            flexWrap: "wrap",
                            alignContent: "stretch",
                        }}
                    >
                        {contexts.contexts.map((c) => (
                            <div
                                style={{
                                    minWidth: "20rem",
                                    height: "50%",
                                    overflow: "hidden",
                                    flexGrow: 1,
                                    flexBasis: 1,
                                }}
                                key={`${c.slot.multi_save_id}_${c.slot.slot_number}`}
                            >
                                <SlotTracker {...c} />
                            </div>
                        ))}
                    </div>
                )
            ),
        [contexts]
    );

    const hintTab = useMemo(() => new Tab("Hints", <HintTab />), []);

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
            }}
        >
            {contexts.refreshing && (
                <Spinner style={{ width: "1rem" }} size={28} />
            )}
            <MultiWorldContext.Provider value={multiWorldContext}>
                <Tabs
                    style={{
                        width: "100%",
                        height: "100%",
                        overflow: "auto",
                    }}
                    tabs={[inventoryTab, hintTab]}
                />
            </MultiWorldContext.Provider>
        </div>
    );
};

export default MultiWorldTracker;
