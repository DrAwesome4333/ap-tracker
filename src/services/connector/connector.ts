import { API, Client } from "archipelago.js";
import CONNECTION_MESSAGES from "./connectionMessages";
import { setAPLocations, setupAPCheckSync } from "./checkSync";
import NotificationManager, {
    MessageType,
} from "../notifications/notifications";
import { enableDataSync } from "./remoteSync";
import { setupAPInventorySync } from "./inventorySync";
import { LocationManager } from "../locations/locationManager";
import { InventoryManager } from "../inventory/inventoryManager";
import { TagManager } from "../tags/tagManager";
import { TrackerManager } from "../tracker/TrackerManager";
import TextClientManager from "../textClientManager";
import { setupAPTextSync } from "./textSync";
import { globalOptionManager } from "../options/optionManager";
import GenericTrackerRepository from "../tracker/generic/genericTrackerRepository";
import HintManager from "../HintManager";
import { LocationTagger } from "../tags/LocationTagger";
import DataPackageHelper from "../MultiInfo/DatapackageHelper";
import SavedConnectionManager from "../savedConnections/savedConnectionManager";
import MultiWorldContext from "../MultiInfo/MultiWorldContext";
import { migrateConnection, migrateTags } from "../MultiInfo/Migration";
import { DB_STORE_KEYS, SaveData } from "../saveData";

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
    groups: {
        location: { [groupName: string]: string[] };
        item: { [groupName: string]: string[] };
    };
}

interface Connector {
    connectToAP: ({
        legacy_connection_id,
        multi_slot,
        host,
        port,
        slot_name,
        password,
    }: {
        host?: string;
        port?: string;
        slot_name?: string;
        password?: string;
        legacy_connection_id?: string;
        multi_slot?: { multi_save_id: string; slot_number: number };
    }) => Promise<void>;
    connection: {
        status: string;
        readonly subscribe: (listener: () => void) => () => void;
        readonly unsubscribe: (listener: () => void) => void;
        readonly client: Client;
        readonly slotInfo: SlotInfo;
    };
}

const createConnector = (
    locationManager: LocationManager,
    inventoryManger: InventoryManager,
    tagManager: TagManager,
    hintManager: HintManager,
    trackerManager: TrackerManager,
    textClientManager: TextClientManager,
    genericTrackerRepository: GenericTrackerRepository,
    locationTagger: LocationTagger
): Connector => {
    const client = new Client({ debugLogVersions: false });
    const connection = (() => {
        let connectionStatus = CONNECTION_STATUS.disconnected;
        let slotInfo: SlotInfo = {
            slotName: "",
            alias: "",
            connectionId: "",
            name: "",
            game: "",
            groups: {
                location: {},
                item: {},
            },
        };
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

    let apTags = ["Tracker", "Checklist"];
    let receiveText =
        (globalOptionManager.getOptionValue(
            "TextClient:show",
            "global"
        ) as boolean) ?? true;

    const updateTags = () => {
        apTags = ["Tracker", "Checklist"];
        if (!receiveText) {
            apTags.push("NoText");
        }
        if (client.authenticated) {
            client.updateTags(apTags);
        }
    };

    const toggleText = () => {
        receiveText =
            (globalOptionManager.getOptionValue(
                "TextClient:show",
                "global"
            ) as boolean) ?? true;
        updateTags();
    };

    globalOptionManager.getSubscriberCallback(
        "TextClient:show",
        "global"
    )(toggleText);

    setupAPCheckSync(client, locationManager, hintManager);
    setupAPInventorySync(client, inventoryManger);
    setupAPTextSync(client, textClientManager);

    client.package.setCache(DataPackageHelper);

    client.socket.on("disconnected", () => {
        connection.status = CONNECTION_STATUS.disconnected;
        NotificationManager.createToast({
            type: MessageType.warning,
            message: "Disconnected from Archipelago Server",
            duration: 10,
        });
    });

    const connectToAP = async ({
        host,
        port,
        slot_name,
        password,
        legacy_connection_id,
        multi_slot,
    }: {
        host?: string;
        port?: string;
        slot_name?: string;
        password?: string;
        legacy_connection_id?: string;
        multi_slot?: { multi_save_id: string; slot_number: number };
    }) => {
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

        // remove code related to this in February 2026
        let migrationRequired = false;

        if (legacy_connection_id) {
            const connectionInfo =
                SavedConnectionManager.loadSavedConnectionData().connections[
                    legacy_connection_id
                ];
            if (!connectionInfo) {
                throw new Error("Cannot find specified slot");
            }
            if (connectionInfo) {
                migrationRequired = !connectionInfo.migrated;
                host = connectionInfo.host;
                slot_name = connectionInfo.slot;
                port = connectionInfo.port;
                password = connectionInfo.password ?? "";
                if (connectionInfo.migrated) {
                    // don't try to use migrated content
                    legacy_connection_id = null;
                }
            }
        } else if (multi_slot) {
            const multi_world_info = MultiWorldContext.getMultiWorld(
                multi_slot.multi_save_id
            );
            const slot_info = MultiWorldContext.getSlot(
                multi_slot.multi_save_id,
                multi_slot.slot_number
            );

            if (!multi_world_info || !slot_info) {
                throw new Error("Cannot find specified slot");
            }
            ({ host, port, password } = multi_world_info.connection_details);
            slot_name = slot_info.slot_name;
        }

        // verify
        if (host.trim().length === 0) {
            throw CONNECTION_MESSAGES.generalError({
                message: "Please specify a host address",
            });
        }

        if (slot_name.trim().length === 0) {
            throw CONNECTION_MESSAGES.generalError({
                message: "Please specify a slot name",
            });
        }

        if (!port) {
            port = "38281";
        }

        // update status message, create connecting alert
        connection.status = CONNECTION_STATUS.connecting;
        const statusMessageHandle = NotificationManager.createStatus({
            message: `Connecting to ${host}:${port} ...`,
            type: MessageType.progress,
            id: "ap-connection",
        });

        updateTags();

        locationManager.deleteAllLocations();
        inventoryManger.clear();

        return client
            .login(`${host}:${port}`, slot_name, undefined, {
                tags: apTags,
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
                    slotName: slot_name,
                    alias: client.players.self.alias,
                    game: client.players.self.game,
                };

                const seed_name = client.room.seedName;
                let seedMatchesSave = false;
                const slot_number = client.players.self.slot;
                const game = client.game;

                if (legacy_connection_id) {
                    const connectionInfo =
                        SavedConnectionManager.loadSavedConnectionData()
                            .connections[legacy_connection_id];
                    seedMatchesSave = connectionInfo.seed === seed_name;
                } else if (multi_slot) {
                    const multi_details = MultiWorldContext.getMultiWorld(
                        multi_slot.multi_save_id
                    );
                    seedMatchesSave = multi_details.seed_name === seed_name;
                }

                if (seedMatchesSave && migrationRequired) {
                    const connectionInfo =
                        SavedConnectionManager.loadSavedConnectionData()
                            .connections[legacy_connection_id];
                    const { multi_world, slot } = migrateConnection(
                        connectionInfo,
                        slot_number
                    );
                    locationTagger.loadTags(
                        multi_world.multi_save_id,
                        slot.slot_number
                    );
                    migrateTags(
                        client,
                        connectionInfo.saveData?.tagData ?? {},
                        locationTagger
                    );
                    connectionInfo.migrated = true;
                    SavedConnectionManager.saveConnectionData(connectionInfo);
                    multi_slot = {
                        multi_save_id: multi_world.multi_save_id,
                        slot_number,
                    };
                    legacy_connection_id = null;
                } else if (!seedMatchesSave) {
                    // attempt to find correct save or create a new one
                    let multi_info =
                        MultiWorldContext.findMatchingMultiWorld(seed_name);
                    if (!multi_info) {
                        multi_info = MultiWorldContext.createMultiWorldDetails({
                            seed_name,
                            connection_details: { host, port, password },
                        });
                    }
                    let slot_info = MultiWorldContext.getSlot(
                        multi_info.seed_name,
                        slot_number
                    );
                    if (!slot_info) {
                        slot_info = MultiWorldContext.addSlot(
                            multi_info.multi_save_id,
                            {
                                game,
                                slot_name,
                                slot_number,
                                slot_alias: client.players.self.alias,
                            }
                        );
                    }
                    multi_slot = {
                        multi_save_id: multi_info.multi_save_id,
                        slot_number,
                    };
                }

                setAPLocations(client, locationManager);
                MultiWorldContext.setLoadedSlot(
                    multi_slot.multi_save_id,
                    slot_number
                );

                // Load groups from save data or request them from AP
                const getGroups = async (): Promise<{
                    item: { [name: string]: string[] };
                    location: { [name: string]: string[] };
                }> => {
                    // delete(itemGroups[`_read_item_name_groups_${client.game}`]['Everything']);
                    const cachedGroups = (await SaveData.getItem(
                        DB_STORE_KEYS.groupCache,
                        [multi_slot.multi_save_id, multi_slot.slot_number]
                    )) as {
                        multi_save_id: string;
                        slot_number: number;
                        groups: {
                            item: { [name: string]: string[] };
                            location: { [name: string]: string[] };
                        };
                    };
                    if (cachedGroups) {
                        return cachedGroups.groups;
                    }
                    // @ts-expect-error, typing error in archipelago.js
                    const locationGroups: { [groupName: string]: string[] } =
                        await client.storage
                            .fetchLocationNameGroups(client.game)
                            .then(
                                (a) =>
                                    a[
                                        `_read_location_name_groups_${client.game}`
                                    ]
                            );
                    // @ts-expect-error, typing error in archipelago.js
                    const itemGroups: { [groupName: string]: string[] } =
                        await client.storage
                            .fetchItemNameGroups(client.game)
                            .then(
                                (a) =>
                                    a[`_read_item_name_groups_${client.game}`]
                            );
                    const groups = {
                        item: itemGroups,
                        location: locationGroups,
                    };
                    SaveData.storeItem(DB_STORE_KEYS.groupCache, {
                        multi_save_id: multi_slot.multi_save_id,
                        slot_number,
                        groups,
                    });
                    return groups;
                };
                getGroups().then(
                    async (groups: {
                        item: { [name: string]: string[] };
                        location: { [name: string]: string[] };
                    }) => {
                        connection.slotInfo = {
                            ...connection.slotInfo,
                            groups,
                        };

                        genericTrackerRepository.configureGenericTrackers(
                            MultiWorldContext.loadedSlot.game,
                            groups
                        );
                        trackerManager.loadTrackers(
                            MultiWorldContext.loadedSlot.game
                        );
                    }
                );
                enableDataSync(client, tagManager);
                locationTagger.loadTags(
                    MultiWorldContext.loadedMultiWorld.multi_save_id,
                    MultiWorldContext.loadedSlot.slot_number
                );

                const dataPackage = client.package.exportPackage();
                DataPackageHelper.cachePackage(dataPackage);
                if (!MultiWorldContext.loadedMultiWorld.data_package_details) {
                    const details: { [gameName: string]: string } = {};
                    Object.entries(dataPackage.games).forEach(
                        ([game, gamePackage]) => {
                            details[game] = gamePackage.checksum;
                        }
                    );
                    MultiWorldContext.updateMultiWorld(
                        MultiWorldContext.loadedMultiWorld.multi_save_id,
                        { data_package_details: details }
                    );
                }
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
                    slot: slot_name,
                    game: "",
                    error: e,
                });
            });
    };
    return { connectToAP, connection };
};

export { CONNECTION_STATUS, createConnector };
export type { Connector };
