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
import { createGroupManager } from "./services/sections/groupManager";
import { createSectionManager } from "./services/sections/sectionManager";
import { createTagManager } from "./services/tags/tagManager";
import { InventoryManager } from "./services/inventory/inventoryManager";
import { globalOptionManager } from "./services/options/optionManager";
import NotificationContainer from "./components/notifications/notificationContainer";
import { background, textPrimary } from "./constants/colors";
import useOption from "./hooks/optionHook";
import { readThemeValue } from "./services/theme/theme";
import TrackerScreen from "./components/TrackerScreen";
import TrackerManager from "./games/TrackerManager";
import CustomTrackerManager from "./games/generic/categoryGenerators/customTrackerManager";
import TextClientManager from "./services/textClientManager";

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
const groupManager = createGroupManager(entranceManager);
const sectionManager = createSectionManager(
    locationManager,
    entranceManager,
    groupManager
);
const tagManager = createTagManager(locationManager);
const trackerManager = new TrackerManager(
    locationManager,
    groupManager,
    sectionManager,
    inventoryManager
);

const textClientManager = new TextClientManager();
CustomTrackerManager.readyCallback(trackerManager.loadSavedTrackerChoices);
const connector = createConnector(
    locationManager,
    inventoryManager,
    entranceManager,
    tagManager,
    trackerManager,
    textClientManager
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
    return (
        <div className="App" data-theme={readThemeValue(themeValue)}>
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
                            entranceManager,
                            connector,
                            groupManager,
                            sectionManager,
                            tagManager,
                            optionManager,
                            inventoryManager,
                            trackerManager,
                            textClientManager,
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
