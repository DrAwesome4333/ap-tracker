import React, { useState, useSyncExternalStore } from "react";
import MainHeader from "./components/MainHeader";
import StartScreen from "./components/StartScreen";
import { TrackerStateContext } from "./contexts/contexts";
import { createConnector } from "./services/connector/connector";
import styled from "styled-components";
import { CONNECTION_STATUS } from "./services/connector/connector";
import OptionsScreen from "./components/optionsComponents/OptionsScreen";
import { createEntranceManager } from "./services/entrances/entranceManager";
import { LocationManager } from "./services/locations/locationManager";
import ServiceContext from "./contexts/serviceContext";
import { createTagManager } from "./services/tags/tagManager";
import { InventoryManager } from "./services/inventory/inventoryManager";
import { globalOptionManager } from "./services/options/optionManager";
import NotificationContainer from "./components/notifications/notificationContainer";
import { background, textPrimary } from "./constants/colors";
import useOption from "./hooks/optionHook";
import { readThemeValue } from "./services/theme/theme";
import TrackerScreen from "./components/TrackerScreen";
import { TrackerManager } from "./services/tracker/TrackerManager";
import { CustomTrackerRepository } from "./services/tracker/customTrackerRepository";
import TextClientManager from "./services/textClientManager";
import GenericTrackerRepository from "./services/tracker/generic/genericTrackerRepository";
import { ResourceType } from "./services/tracker/resourceEnums";
import { LocalStorageDataStore } from "./services/dataStores";
import { portTrackers } from "./services/tracker/locationTrackers/loadV1CustomTrackers";
import { LocationTracker } from "./services/tracker/locationTrackers/locationTrackers";
import { ItemTracker } from "./services/tracker/itemTrackers/itemTrackers";

const AppScreen = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    display: grid;
    overflow: auto;
    background-color: ${background};
    justify-items: stretch;
    align-items: stretch;
    color: ${textPrimary};
    transition:
        background-color 0.25s ease-in-out,
        color 0.25s ease-in-out;
    grid-template-rows: 3em 1fr;
    grid-template-columns: auto;
`;

const locationManager = new LocationManager();
const inventoryManager = new InventoryManager();
const entranceManager = createEntranceManager();
const optionManager = globalOptionManager;

const tagManager = createTagManager(locationManager);
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
// Port from old version
portTrackers(customTrackerRepository);

const textClientManager = new TextClientManager();

const connector = createConnector(
    locationManager,
    inventoryManager,
    entranceManager,
    tagManager,
    trackerManager,
    textClientManager,
    genericTrackerRepository
);

const connection = connector.connection;

const App = (): React.ReactNode => {
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
    const [optionWindowOpen, setOptionWindowOpen] = useState(false);
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
    return (
        <div className="App" data-theme={readThemeValue(themeValue)}>
            <title>{titleParts.join(" | ")}</title>
            <AppScreen data-theme={readThemeValue(themeValue)}>
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
                            entranceManager,
                            connector,
                            tagManager,
                            optionManager,
                            inventoryManager,
                            trackerManager,
                            textClientManager,
                            customTrackerRepository,
                            genericTrackerRepository,
                        }}
                    >
                        <NotificationContainer />
                        <MainHeader
                            optionsCallback={() => {
                                setOptionWindowOpen(!optionWindowOpen);
                            }}
                        />
                        {optionWindowOpen && <OptionsScreen />}
                        {!optionWindowOpen && (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    overflow: "auto",
                                }}
                            >
                                {new Set([
                                    CONNECTION_STATUS.disconnected,
                                    CONNECTION_STATUS.connecting,
                                ]).has(trackerConnectionState) && (
                                    <StartScreen />
                                )}
                                {CONNECTION_STATUS.connected ===
                                    trackerConnectionState && <TrackerScreen />}
                            </div>
                        )}
                    </ServiceContext.Provider>
                </TrackerStateContext.Provider>
            </AppScreen>
        </div>
    );
};

export default App;
