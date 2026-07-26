import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useCurrentActivity } from "../../hooks/activityHook";
import { GamePackageWrapper } from "../../services/gamepackage/GamePackageWrapper";
import MultiWorldContext, {
    SavedSlotDetails,
} from "../../services/MultiInfo/MultiWorldContext";
import WebHostSlotSource from "../../services/WebHostConnector/WebHostSlotSource";
import DataPackageHelper from "../../services/MultiInfo/DatapackageHelper";
import WebHostAPIHandler from "../../services/WebHostAPI";
import SlotTracker from "./SlotTracker";
import Spinner from "../icons/spinner";

const useWebHostSlots = (multiSaveId: string) => {
    const initialized = useRef(false);
    const loaded = useRef(false);
    const [refreshing, setRefreshing] = useState(false);
    const apiHandlerRef = useRef<WebHostAPIHandler>(null);
    const [gamePackages, setGamePackages] = useState<
        Record<string, GamePackageWrapper>
    >({});
    const [slotDetails, setSlotDetails] = useState<SavedSlotDetails[]>([]);
    const [hostSources, setHostSources] = useState<WebHostSlotSource[]>([]);

    const update = useEffectEvent(async () => {
        if (!loaded.current || !apiHandlerRef.current) {
            return false;
        }
        setRefreshing(true);
        await apiHandlerRef.current
            .getTracker()
            .then((apiResult) => {
                hostSources.forEach((source) => source.refresh(apiResult));
            })
            .catch((e) => {
                // TODO error handling;
            });
        setRefreshing(false);
        return true;
    });

    const initialize = async () => {
        initialized.current = true;
        loaded.current = false;
        const multiWorld = MultiWorldContext.getMultiWorld(multiSaveId);
        if (!multiWorld.room_details) {
            return;
        }

        apiHandlerRef.current = new WebHostAPIHandler(multiWorld.room_details);

        const packageResults: Record<string, GamePackageWrapper> = {};
        if (multiWorld.data_package_details) {
            const tasks = Object.entries(multiWorld.data_package_details).map(
                async ([game, hash]) => {
                    // TODO add error handling, use web API if needed
                    packageResults[game] = new GamePackageWrapper(
                        await DataPackageHelper.getCachedPackage(game, hash),
                        game
                    );
                }
            );
            await Promise.all(tasks);
            setGamePackages(packageResults);
        } else {
            throw new Error("Missing data package details?");
        }

        const slots = MultiWorldContext.findAllSlotsForMultiWorld(multiSaveId);
        setSlotDetails(slots);
        const sources = slots.map(
            (slot) =>
                new WebHostSlotSource(
                    packageResults[slot.game],
                    slot.slot_number
                )
        );
        setHostSources(sources);
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
            gamePackages,
            contexts: slotDetails.map((slot, index) => ({
                slot,
                webHostSource: hostSources[index],
            })),
        }),
        [slotDetails, hostSources, refreshing]
    );

    return context;
};

const MultiWorldTracker = () => {
    const currentActivityName = useCurrentActivity();
    const multiWorldId = currentActivityName?.split("/")[1];
    const contexts = useWebHostSlots(multiWorldId);

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
            Multi-world Tracker: {multiWorldId}
            <div
                style={{
                    display: "flex",
                    height: "100%",
                    width: "100%",
                    flexWrap: "wrap",
                }}
            >
                {contexts.contexts.map((c) => (
                    <div
                        style={{
                            maxWidth: "50rem",
                            minWidth: "20rem",
                            height: "50%",
                            overflow: "hidden",
                        }}
                        key={`${c.slot.multi_save_id}_${c.slot.slot_number}`}
                    >
                        <SlotTracker
                            gamePackages={contexts.gamePackages}
                            {...c}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MultiWorldTracker;
