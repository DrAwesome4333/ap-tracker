// @ts-check
// import './App.css';
import React, { useState, useSyncExternalStore } from "react";
import MainHeader from "./components/MainHeader";
import StartScreen from "./components/StartScreen";
import { TrackerStateContext } from "./contexts/contexts";
import { createConnector } from "./services/connector/connector";
import styled from "styled-components";
import { CONNECTION_STATUS } from "./services/connector/connector";
import OptionsScreen from "./components/OptionsScreen";
import SectionView from "./components/sectionComponents/SectionView";
import { createEntranceManager } from "./services/entrances/entranceManager";
import { createCheckManager } from "./services/checks/checkManager";
import ServiceContext from "./contexts/serviceContext";
import { createGroupManager } from "./services/sections/groupManager";
import { createRegionManager } from "./services/regions/regionManager";
import { createSectionManager } from "./services/sections/sectionManager";

const AppScreen = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    display: grid;

    grid-template-rows: auto 1fr;
    grid-template-columns: auto;
`;

const checkManager = createCheckManager();
const entranceManager = createEntranceManager();
const connector = createConnector(checkManager);
const regionManager = createRegionManager();
const groupManager = createGroupManager(entranceManager, regionManager);
const sectionManager = createSectionManager(
    checkManager,
    entranceManager,
    groupManager
);
const connection = connector.connection;

entranceManager.resetEntranceTable();

function App() {
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

    return (
        <div className="App">
            <AppScreen>
                <TrackerStateContext.Provider
                    value={{
                        connectionStatus: trackerConnectionState,
                        slotData: trackerSlotData
                    }}
                >
                    <ServiceContext.Provider
                        value={{
                            checkManager,
                            entranceManager,
                            connector,
                            groupManager,
                            sectionManager,
                        }}
                    >
                        <MainHeader optionsCallback={() => {setOptionWindowOpen(!optionWindowOpen)}} />
                        {optionWindowOpen && <OptionsScreen />}
                        {!optionWindowOpen && (
                            <>
                                {new Set([
                                    CONNECTION_STATUS.disconnected,
                                    CONNECTION_STATUS.connecting,
                                ]).has(trackerConnectionState) && (
                                    <StartScreen />
                                )}
                                {CONNECTION_STATUS.connected ===
                                    trackerConnectionState && (
                                    <SectionView name="root" context={{}} />
                                )}
                            </>
                        )}
                    </ServiceContext.Provider>
                </TrackerStateContext.Provider>
            </AppScreen>
        </div>
    );
}

export default App;