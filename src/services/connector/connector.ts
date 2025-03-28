import { API, Client } from "archipelago.js";
import CONNECTION_MESSAGES from "./connectionMessages";
import { setAPLocations, setupAPCheckSync } from "./checkSync";
import SavedConnectionManager, { SavedConnectionInfo } from "../savedConnections/savedConnectionManager";
import NotificationManager, { MessageType } from "../notifications/notifications";
import { enableDataSync } from "./remoteSync";
import { setupAPInventorySync } from "./inventorySync";
import { CheckManager } from "../checks/checkManager";
import { InventoryManager } from "../inventory/inventoryManager";
import { EntranceManager } from "../entrances/entranceManager";
import { TagManager } from "../tags/tagManager";
import TrackerManager from "../../games/TrackerManager";

const CONNECTION_STATUS = {
    disconnected: "Disconnected",
    connecting: "Connecting",
    connected: "Connected",
    error: "Error", // unrecoverable state
};

interface SlotInfo {
    slotName: string;
    alias?: string;
    connectionId: string;
    name: string;
    game: string;
}

interface Connector {
    connectToAP: ({ host, port, slot, password }: { host: string; port: string; slot: string; password: string; }) => Promise<void>;
    connection: { status: string; readonly subscribe: (listener: () => void) => () => void; readonly unsubscribe: (listener: () => void) => void; readonly client: Client; readonly slotInfo: SlotInfo; };
}

const createConnector = (
    checkManager: CheckManager,
    inventoryManger: InventoryManager,
    entranceManager: EntranceManager,
    tagManager: TagManager,
    trackerManager: TrackerManager,
): Connector => {
    const client = new Client();
    const connection = (() => {
        let connectionStatus = CONNECTION_STATUS.disconnected;
        let slotInfo: SlotInfo = { slotName: "", alias: "", connectionId: "", name: "", game:"" };
        const listeners: Set<() => void> = new Set();
        const subscribe = (listener: () => void) => {
            listeners.add(listener);
            return () => unsubscribe(listener);
        };
        const unsubscribe = (listener: () => void) => {
            listeners.delete(listener);
        };
        const callListeners = () => {
            listeners.forEach((listener) => listener());
        };
        return {
            get status() {
                return connectionStatus;
            },
            set status(val) {
                connectionStatus = val;
                callListeners();
            },
            get slotInfo() {
                return slotInfo;
            },
            set slotInfo(val) {
                slotInfo = val;
                callListeners();
            },
            get subscribe() {
                return subscribe;
            },
            get unsubscribe() {
                return unsubscribe;
            },
            get client() {
                return client;
            },
        };
    })();

    setupAPCheckSync(client, checkManager, tagManager, connection);
    setupAPInventorySync(client, inventoryManger);

    const connectToAP = async ({ host, port, slot, password }: { host: string; port: string; slot: string; password: string | undefined; }) => {
        if (connection.status !== CONNECTION_STATUS.disconnected) {
            if (connection.status === CONNECTION_STATUS.connected) {
                throw CONNECTION_MESSAGES.alreadyConnected();
            } else if (connection.status === CONNECTION_STATUS.connecting) {
                throw CONNECTION_MESSAGES.alreadyConnecting();
            } else {
                throw CONNECTION_MESSAGES.generalError({
                    message:
                        "The tracker is in an error state, please refresh the page.",
                });
            }
        }

        // verify
        if (host.trim().length === 0) {
            throw CONNECTION_MESSAGES.generalError({
                message: "Please specify a host address",
            });
        }

        if (slot.trim().length === 0) {
            throw CONNECTION_MESSAGES.generalError({
                message: "Please specify a slot name",
            });
        }

        if (!port) {
            port = "38281";
        }

        connection.status = CONNECTION_STATUS.connecting;
        const statusMessageHandle = NotificationManager.createStatus({
            message: `Connecting to ${host}:${port} ...`,
            type: MessageType.progress,
            id: "ap-connection",
        });
        return client
            .login(`${host}:${port}`, slot, undefined, {
                tags: ["Tracker", "Checklist"],
                password,
                items: API.itemsHandlingFlags.all,
            })
            .then((_packet) => {
                statusMessageHandle.update({
                    ...CONNECTION_MESSAGES.connectionSuccess({
                        playerAlias: client.players.self.alias,
                        game: client.players.self.game,
                    }),
                    duration: 5,
                    progress: 1,
                });

                connection.status = CONNECTION_STATUS.connected;
                connection.slotInfo = {
                    ...connection.slotInfo,
                    slotName: slot,
                    alias: client.players.self.alias,
                    game: client.players.self.game,
                };

                client.socket.on("disconnected", () => {
                    connection.status = CONNECTION_STATUS.disconnected;
                    NotificationManager.createToast({
                        type: MessageType.warning,
                        message: "Disconnected from Archipelago Server",
                        duration: 10,
                    });
                });

                const savedConnectionInfo: SavedConnectionInfo = {
                    seed: client.room.seedName,
                    host,
                    slot,
                    port,
                    game: client.players.self.game,
                    playerAlias: client.players.self.alias,
                };

                const possibleMatches =
                    SavedConnectionManager.getExistingConnections(
                        savedConnectionInfo
                    );

                if (possibleMatches.size > 0) {
                    // Update existing entry
                    const chosenConnection = [...possibleMatches.values()][0];
                    chosenConnection.lastUsedTime = Date.now();
                    chosenConnection.host = savedConnectionInfo.host;
                    chosenConnection.port = savedConnectionInfo.port;
                    chosenConnection.playerAlias =
                        savedConnectionInfo.playerAlias;
                    SavedConnectionManager.saveConnectionData(chosenConnection);
                    connection.slotInfo = {
                        ...connection.slotInfo,
                        connectionId: chosenConnection.connectionId,
                    };
                } else {
                    // Create a new entry
                    const newConnectionData =
                        SavedConnectionManager.createNewSavedConnection(
                            savedConnectionInfo
                        );
                    SavedConnectionManager.saveConnectionData(
                        newConnectionData
                    );
                    connection.slotInfo = {
                        ...connection.slotInfo,
                        connectionId: newConnectionData.connectionId,
                    };
                }
                setAPLocations(client, checkManager);
                const savedConnectionData =
                    SavedConnectionManager.getConnectionSaveData(
                        connection.slotInfo.connectionId
                    );
                // Load groups from save data or request them from AP
                const getGroups = async (): Promise<{ [groupName: string]: string[] }> => {
                    if (savedConnectionData.locationGroups) {
                        return savedConnectionData.locationGroups;
                    }
                    // @ts-expect-error, typing error in archipelago.js
                    const groups: { [groupName: string]: string[] } = await client.storage
                        .fetchLocationNameGroups(client.game)
                        .then(
                            (a) =>
                                a[`_read_location_name_groups_${client.game}`]
                        );
                    savedConnectionData.locationGroups = groups;
                    SavedConnectionManager.updateConnectionSaveData(
                        connection.slotInfo.connectionId,
                        savedConnectionData
                    );
                    return savedConnectionData.locationGroups;
                };
                getGroups().then((groups: { [groupName: string]: string[] }) => {
                    trackerManager.initializeTracker({
                        gameName: savedConnectionInfo.game,
                        entranceManager,
                        slotData: {},
                        groups
                    }

                    );
                    tagManager.loadTags(connection.slotInfo.connectionId);
                });
                enableDataSync(client, tagManager);
            })
            .catch((e) => {
                statusMessageHandle.update({
                    message: `Failed to connect`,
                    type: MessageType.error,
                    duration: 4,
                    progress: 1,
                });
                connection.status = CONNECTION_STATUS.disconnected;
                connection.slotInfo = {
                    ...connection.slotInfo,
                    name: "",
                    alias: "",
                };
                throw CONNECTION_MESSAGES.connectionFailed({
                    host,
                    port,
                    slot,
                    game: "",
                    error: e,
                });
            });
    };
    return { connectToAP, connection };
};

export { CONNECTION_STATUS, createConnector };
export type { Connector }
