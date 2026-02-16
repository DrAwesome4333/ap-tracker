import React, { useState, useSyncExternalStore } from "react";
import MainHeader from "./components/header/MainHeader";
import StartScreen from "./components/StartScreen/StartScreen";
import { TrackerStateContext } from "./contexts/contexts";
import { createConnector } from "./services/connector/connector";
import { CONNECTION_STATUS } from "./services/connector/connector";
import OptionsScreen from "./components/optionsComponents/OptionsScreen";
import { LocationManager } from "./services/locations/locationManager";
import ServiceContext from "./contexts/serviceContext";
import { TagManager } from "./services/tags/tagManager";
import { LocationTagger } from "./services/tags/LocationTagger";
import { InventoryManager } from "./services/inventory/inventoryManager";
import { globalOptionManager } from "./services/options/optionManager";
import NotificationContainer from "./components/notifications/notificationContainer";
import useOption from "./hooks/optionHook";
import { readThemeValue } from "./services/theme/theme";
import TrackerScreen from "./components/TrackerScreen";
import { TrackerManager } from "./services/tracker/TrackerManager";
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
import { useActivityContext } from "./hooks/activityHook";
import ActivityContext from "./contexts/activityContext";

const locationManager = new LocationManager();
const inventoryManager = new InventoryManager();
const optionManager = globalOptionManager;

const tagManager = new TagManager();
tagManager.enableLocationEffects(locationManager);
const locationTagger = new LocationTagger();
const hintTagger = new HintTagger(optionManager);
tagManager.addSource(locationTagger);
tagManager.addSource(hintTagger);
const hintManager = new HintManager(hintTagger);
const mainTrackerManagerStore = new LocalStorageDataStore(
    "AP_ChecklistTracker_TrackerChoices"
);
const trackerManager = new TrackerManager(mainTrackerManagerStore);
const customTrackerRepository = new CustomTrackerRepository(
    optionManager,
    locationManager,
    inventoryManager
);
const genericTrackerRepository = new GenericTrackerRepository(
    optionManager,
    locationManager,
    inventoryManager
);
trackerManager.addRepository(customTrackerRepository);
trackerManager.addRepository(genericTrackerRepository);
const textClientManager = new TextClientManager();

const connector = createConnector(
    locationManager,
    inventoryManager,
    tagManager,
    hintManager,
    trackerManager,
    textClientManager,
    genericTrackerRepository,
    locationTagger
);

const connection = connector.connection;

const App = (): React.ReactNode => {
    const activityContext = useActivityContext();
    const trackerConnectionState = useSyncExternalStore(
        connection.subscribe,
        () => connection.status,
        () => connection.status
    );
    const trackerSlotData = useSyncExternalStore(
        connection.subscribe,
        () => connection.slotInfo,
        () => connection.slotInfo
    );
    const optionWindowOpen = activityContext.stack.includes('options');
    const themeValue = useOption(optionManager, "Theme:base", "global") as
        | "light"
        | "dark"
        | "system"
        | null;

    const locationTracker = useSyncExternalStore(
        trackerManager.getTrackerSubscriberCallback(
            ResourceType.locationTracker
        ),
        () => trackerManager.getCurrentTracker(ResourceType.locationTracker),
        () => trackerManager.getCurrentTracker(ResourceType.locationTracker)
    ) as LocationTracker;
    const itemTracker = useSyncExternalStore(
        trackerManager.getTrackerSubscriberCallback(ResourceType.itemTracker),
        () => trackerManager.getCurrentTracker(ResourceType.itemTracker),
        () => trackerManager.getCurrentTracker(ResourceType.itemTracker)
    ) as ItemTracker;
    const titleParts = ["AP Checklist Tracker"];
    if (connector.connection?.slotInfo.alias) {
        titleParts.unshift(connector.connection?.slotInfo.alias);
    }

    const apColors = useAPColorStyles(optionManager, "global");

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
                <TrackerStateContext.Provider
                    value={{
                        connectionStatus: trackerConnectionState,
                        slotData: trackerSlotData,
                    }}
                >
                    <ServiceContext.Provider
                        value={{
                            locationManager,
                            locationTracker,
                            inventoryTracker: itemTracker,
                            connector,
                            tagManager,
                            optionManager,
                            inventoryManager,
                            trackerManager,
                            textClientManager,
                            customTrackerRepository,
                            genericTrackerRepository,
                            locationTagger,
                            hintTagger,
                            hintManager,
                        }}
                    >
                        <NotificationContainer />
                        <MainHeader
                            optionsCallback={() => {
                                if(optionWindowOpen){
                                    activityContext.drop("options");
                                } else {
                                    activityContext.add("options");
                                }
                            }}
                        />
                        {optionWindowOpen && <OptionsScreen />}
                        {activityContext.stack.length === 0 && <StartScreen/>}
                        {activityContext.stack[activityContext.stack.length - 1] === 'slot-tracker' && <TrackerScreen/>}
                    </ServiceContext.Provider>
                </TrackerStateContext.Provider>
            </ActivityContext.Provider>
        </div>
    );
};

export default App;
