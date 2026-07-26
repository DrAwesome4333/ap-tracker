import React, { useCallback, useEffect, useState } from "react";
import MainHeader from "./components/header/MainHeader";
import StartScreen from "./components/StartScreen/StartScreen";
import OptionsScreen from "./components/optionsComponents/OptionsScreen";
import ServiceContext from "./contexts/serviceContext";
import { TagManager } from "./services/tags/tagManager";
import { LocationTagger } from "./services/tags/LocationTagger";
import { globalOptionManager } from "./services/options/optionManager";
import NotificationContainer from "./components/notifications/notificationContainer";
import useOption from "./hooks/optionHook";
import { readThemeValue } from "./services/theme/theme";
import TrackerScreen from "./components/TrackerScreen";
import { CustomTrackerRepository } from "./services/tracker/customTrackerRepository";
import TextClientManager from "./services/textClientManager";
import GenericTrackerRepository from "./services/tracker/generic/genericTrackerRepository";
import { ResourceType } from "./services/tracker/resourceEnums";
import { LocalStorageDataStore } from "./services/dataStores";
import { LocationTracker } from "./services/tracker/locationTrackers/locationTrackers";
import { ItemTracker } from "./services/tracker/itemTrackers/itemTrackers";
import HintTagger from "./services/tags/HintTagger";
import HintManager from "./services/HintManager";
import ApStyles from "./components/sharedStyles/archipelago.module.css";
import { useAPColorStyles } from "./services/theme/ColorManager";
import { useActivityContext, useCurrentActivity } from "./hooks/activityHook";
import ActivityContext from "./contexts/activityContext";
import SlotContext from "./contexts/slotContext";
import LocationRepository from "./services/locations/locationRepository";
import ItemRepository from "./services/items/itemRepository";
import APConnector, {
    ConnectedEventParams,
} from "./services/connector/APConnector";
import { TrackerManager } from "./services/tracker/TrackerManager";
import { useCurrentGameTracker } from "./hooks/trackerHooks";
import { GamePackageWrapper } from "./services/gamepackage/GamePackageWrapper";
import MultiWorldTracker from "./components/MultiWorldTracker/MultiworldTracker";

const optionManager = globalOptionManager;
const mainTrackerManagerStore = new LocalStorageDataStore(
    "AP_ChecklistTracker_TrackerChoices"
);
const trackerManager = new TrackerManager(mainTrackerManagerStore);
const customTrackerRepository = new CustomTrackerRepository(optionManager);
const genericTrackerRepository = new GenericTrackerRepository(optionManager);
trackerManager.addRepository(customTrackerRepository);
trackerManager.addRepository(genericTrackerRepository);
const textClientManager = new TextClientManager();

const hintTagger = new HintTagger(optionManager);
const hintManager = new HintManager(hintTagger);

const connector = new APConnector({
    textClientManager,
    hintManager,
});
hintManager.initializeListeners(connector.client);

const App = (): React.ReactNode => {
    const activityContext = useActivityContext();
    const currentActivityName =
        activityContext.stack.length > 0
            ? activityContext.stack[activityContext.stack.length - 1]
            : null;
    const optionWindowOpen = activityContext.stack.includes("options");
    const themeValue = useOption(optionManager, "Theme:base", "global") as
        | "light"
        | "dark"
        | "system"
        | null;

    const apColors = useAPColorStyles(optionManager, "global");
    const [game, setGame] = useState<string>("");
    const locationTrackerId = useCurrentGameTracker(
        game,
        trackerManager,
        ResourceType.locationTracker
    );
    const itemTrackerId = useCurrentGameTracker(
        game,
        trackerManager,
        ResourceType.itemTracker
    );

    const [locationTracker, setLocationTracker] =
        useState<LocationTracker>(null);
    const [itemTracker, setItemTracker] = useState<ItemTracker>(null);
    const [slotName, setSlotName] = useState<string>("");
    const [slotNumber, setSlotNumber] = useState(0);
    const [slotAlias, setSlotAlias] = useState<string>("");
    const [multiWorldId, setMultiWorldId] = useState<string>("");
    const [locationRepository, setLocationRepository] =
        useState<LocationRepository>(null);
    const [itemRepository, setItemRepository] = useState<ItemRepository>(null);
    const [tagManager, setTagManager] = useState<TagManager>(null);
    const [locationTagger, setLocationTagger] = useState<LocationTagger>(null);
    const [gamePackage, setGamePackage] = useState<GamePackageWrapper>(null);

    const titleParts = ["Checklist Tracker"];
    if (slotAlias) {
        titleParts.unshift(slotAlias);
    }

    const processSlotConnection = useCallback(
        async ({
            slotName: slot_name,
            slotAlias: slot_alias,
            multiWorldId: multi_id,
            slotNumber: slot_number,
            gamePackage,
        }: ConnectedEventParams) => {
            setSlotName(slot_name);
            setSlotAlias(slot_alias);
            setSlotNumber(slot_number);
            setMultiWorldId(multi_id);
            const newItemRepository = new ItemRepository();
            const newLocationRepository = new LocationRepository();
            const newTagManager = new TagManager();
            const newLocationTagger = new LocationTagger(multi_id, slot_number);

            newTagManager.addSource(newLocationTagger);
            newTagManager.addSource(hintTagger);
            newTagManager.enableLocationEffects(newLocationRepository);
            newItemRepository.addSource(connector);
            newLocationRepository.addSource(connector);
            setItemRepository(newItemRepository);
            setLocationRepository(newLocationRepository);
            setGame(gamePackage.game);
            setGamePackage(gamePackage);
            setTagManager(newTagManager);
            setLocationTagger(newLocationTagger);
        },
        []
    );

    useEffect(() => {
        if (locationTrackerId && gamePackage) {
            trackerManager
                ?.loadTracker(locationTrackerId, gamePackage)
                .then((tracker: LocationTracker) => {
                    setLocationTracker(tracker);
                });
        } else {
            setLocationTracker(null);
        }
    }, [locationTrackerId, gamePackage]);

    useEffect(() => {
        if (itemTrackerId && gamePackage) {
            trackerManager
                ?.loadTracker(itemTrackerId, gamePackage)
                .then((tracker: ItemTracker) => {
                    setItemTracker(tracker);
                });
        } else {
            setItemTracker(null);
        }
    }, [itemTrackerId, gamePackage]);

    useEffect(() => {
        const cleanUp = connector.connectedHook(processSlotConnection);
        return () => {
            cleanUp();
        };
    }, [processSlotConnection]);

    return (
        <div
            className={[
                "app",
                "base",
                readThemeValue(themeValue),
                ApStyles.ap_color_wrapper,
            ].join(" ")}
            data-theme={readThemeValue(themeValue)}
            style={{ colorScheme: readThemeValue(themeValue), ...apColors }}
        >
            <title>{titleParts.join(" | ")}</title>
            <ActivityContext.Provider value={activityContext}>
                <SlotContext.Provider
                    value={{
                        game,
                        slotName,
                        slotNumber,
                        slotAlias,
                        multiWorldId,
                        locationRepository,
                        itemRepository,
                        hintManager,
                        tagManager,
                        locationTagger,
                        locationTracker,
                        itemTracker,
                        liveSlot: true,
                    }}
                >
                    <ServiceContext.Provider
                        value={{
                            connector,
                            optionManager,
                            trackerManager,
                            textClientManager,
                            customTrackerRepository,
                        }}
                    >
                        <NotificationContainer />
                        <MainHeader
                            optionsCallback={() => {
                                if (optionWindowOpen) {
                                    activityContext.drop("options");
                                } else {
                                    activityContext.add("options");
                                }
                            }}
                        />
                        {optionWindowOpen && <OptionsScreen />}
                        {activityContext.stack.length === 0 && <StartScreen />}
                        {currentActivityName === "slot-tracker" && (
                            <TrackerScreen />
                        )}
                        {currentActivityName?.startsWith(
                            "multi-world-tracker"
                        ) && <MultiWorldTracker />}
                    </ServiceContext.Provider>
                </SlotContext.Provider>
            </ActivityContext.Provider>
        </div>
    );
};

export default App;
