import { API, Client } from "archipelago.js";
import { Item, ItemSource, ItemUpdateCallback } from "../items/itemSource";
import {
    LocationStatus,
    LocationId,
    LocationSource,
    LocationUpdateCallback,
    LocationStatusUpdate,
} from "../locations/locationSource";
import MultiWorldService from "../MultiInfo/MultiWorldService";
import { LocalStorageDataStore } from "../dataStores";
import { randomUUID } from "../../utility/uuid";
import { GamePackageWrapper } from "../gamepackage/GamePackageWrapper";
import { enableDataSync } from "./remoteSync";
import DataPackageHelper from "../MultiInfo/DatapackageHelper";
import TextClientManager from "../textClientManager";
import { setupAPTextSync } from "./textSync";
import HintManager from "../HintManager";
import WebHostAPIHandler from "../WebHostAPI";
import NotificationManager, {
    MessageType,
    StatusNotificationHandle,
} from "../notifications/notifications";

interface ConnectionConfiguration {
    host?: string;
    port?: string;
    slot_name?: string;
    password?: string;
    multi_slot?: { multi_save_id: string; slot_number: number };
}

enum ConnectionStatus {
    connected = "connected",
    connecting = "connecting",
    disconnected = "disconnected",
}

type APConnectorParams = {
    textClientManager: TextClientManager;
    hintManager: HintManager;
};
type ConnectedEventParams = {
    gamePackage: GamePackageWrapper;
    slotName: string;
    slotAlias: string;
    slotNumber: number;
    multiWorldId: string;
};

const clientUuidStore = new LocalStorageDataStore("ap-checklist-client-uuid");

const validationError = (
    message: string,
    duration: number = 5,
    statusHandler: StatusNotificationHandle = null
) => {
    NotificationManager.createToast({
        message,
        type: MessageType.warning,
        duration,
    });
    if (statusHandler) {
        statusHandler.update({
            message: "Validation failed",
            type: MessageType.warning,
            duration: 3,
            progress: 0,
        });
    }
};

class APConnector implements LocationSource, ItemSource {
    readonly client: Client = null;

    #status: ConnectionStatus = ConnectionStatus.disconnected;
    #clientUuid: string = null;
    #statusChangeCallbacks: Set<() => void> = new Set();
    #connectedCallbacks: Set<(params: ConnectedEventParams) => void> =
        new Set();
    #locationCallbacks: Set<LocationUpdateCallback> = new Set();
    #itemCallbacks: Set<ItemUpdateCallback> = new Set();
    #locations: Map<LocationId, LocationStatus> = new Map();
    #items: Map<number, Item> = new Map();
    #hintManager: HintManager;

    constructor({ textClientManager, hintManager }: APConnectorParams) {
        this.client = new Client({ debugLogVersions: false });
        let uuid: string = clientUuidStore.read("uuid") as string;
        if (!uuid) {
            uuid = randomUUID();
            clientUuidStore.write(uuid, "uuid");
        }
        this.#clientUuid = uuid;
        this.client.package.setCache(DataPackageHelper);
        this.client.socket.on("disconnected", this.#disconnectCallback);

        this.client.room.on("locationsChecked", (locationIds) => {
            const locations: LocationStatusUpdate[] = locationIds.map((id) => ({
                locationId: id,
                checked: true,
            }));
            this.#updateLocations(locations);
        });

        this.client.items.on("itemsReceived", (itemIds, startIndex) => {
            const items: Item[] = itemIds.map((item, index) => ({
                itemId: item.id,
                name: item.name,
                index: index + startIndex,
                locationId: item.locationId,
                location: item.locationName,
                senderSlot: item.sender.slot,
                sender: item.sender.alias,
                flags: {
                    progression: item.progression,
                    useful: item.useful,
                    trap: item.trap,
                    local: item.sender.slot === this.client.players.self.slot,
                    server: item.sender.slot === 0,
                },
            }));
            items.forEach((item) => Object.freeze(item));
            this.#addItems(items);
        });

        setupAPTextSync(this.client, textClientManager);
        hintManager.initializeListeners(this.client);
        this.#hintManager = hintManager;
    }

    #setStatus = (newStatus: ConnectionStatus) => {
        if (newStatus === this.status) {
            return;
        }
        this.#status = newStatus;
        this.#statusChangeCallbacks.forEach((callback) => callback());
    };

    statusUpdateHook = (callback: () => void) => {
        this.#statusChangeCallbacks.add(callback);
        return () => {
            this.#statusChangeCallbacks.delete(callback);
        };
    };

    connectedHook = (callback: (params: ConnectedEventParams) => void) => {
        this.#connectedCallbacks.add(callback);
        return () => {
            this.#connectedCallbacks.delete(callback);
        };
    };

    connect = async (config: ConnectionConfiguration) => {
        if (this.status === ConnectionStatus.connected) {
            validationError("Already connected.");
            return null;
        }
        if (this.status === ConnectionStatus.connecting) {
            validationError("Already connecting.");
            return null;
        }

        let multiSlot = config.multi_slot;
        let host = config.host;
        let port = config.port;
        let password = config.password;
        let slotName = config.slot_name;

        const connectionStatusHandle = NotificationManager.createStatus({
            message: "Validating details",
            type: MessageType.progress,
            progress: -1,
        });

        if (multiSlot) {
            const multiWorldInfo = MultiWorldService.getMultiWorld(
                multiSlot.multi_save_id
            );
            const slotInfo = MultiWorldService.getSlot(
                multiSlot.multi_save_id,
                multiSlot.slot_number
            );
            if (!multiWorldInfo || !slotInfo) {
                validationError(
                    "Failed to load saved multi-world, data may be corrupt or missing.",
                    10,
                    connectionStatusHandle
                );
            }

            ({ host, port, password } = multiWorldInfo.connection_details);
            if (multiWorldInfo.room_details?.room_suuid) {
                connectionStatusHandle.update({
                    message: "Checking room status",
                });
                const apiHandler = new WebHostAPIHandler(
                    multiWorldInfo.room_details
                );
                const roomStatus = await apiHandler.getRoomStatus();
                const newPort = roomStatus.last_port.toString();
                const lastActivity = Date.parse(roomStatus.last_activity);
                const isAwake =
                    Date.now() - lastActivity < roomStatus.timeout * 1000;
                if (!isAwake) {
                    connectionStatusHandle.update({
                        type: MessageType.warning,
                        duration: 3,
                        message: "The room is asleep",
                        progress: 0,
                    });
                    NotificationManager.createToast({
                        message: "The room is asleep",
                        type: MessageType.warning,
                        details: `Your room hasn't been active for a while, you need to open the room page to wake it up.`,
                        action: () =>
                            window?.open(apiHandler.roomLink, "_blank"),
                        actionName: "Open Room Page",
                    });
                    return null;
                }

                if (newPort !== port) {
                    NotificationManager.createToast({
                        message: "Your room's port has changed!",
                        type: MessageType.info,
                        details: `Your new port is ${newPort}, previously it was ${port}`,
                        duration: 5,
                    });
                    port = newPort;
                }
            }
            slotName = slotInfo.slot_name;
        }

        if (host.trim().length === 0) {
            validationError(
                "Please provide a host name",
                5,
                connectionStatusHandle
            );
            return null;
        }

        if (slotName.trim().length === 0) {
            validationError(
                "Please provide a slot name",
                5,
                connectionStatusHandle
            );
            return null;
        }

        if (!port) {
            port = "38281";
        }

        this.#setStatus(ConnectionStatus.connecting);
        connectionStatusHandle.update({
            message: "Connecting to server",
            type: MessageType.progress,
            progress: -1,
        });

        return this.client
            .login(`${host}:${port}`, slotName, undefined, {
                tags: ["Tracker", "Checklist"],
                password,
                items: API.itemsHandlingFlags.all,
                slotData: false,
                uuid: this.#clientUuid,
            })
            .then(async (_packet) => {
                this.#setStatus(ConnectionStatus.connected);
                const seedName = this.client.room.seedName;
                let seedMatchesSave = false;
                const slotNumber = this.client.players.self.slot;
                const game = this.client.game;

                if (multiSlot) {
                    const multiDetails = MultiWorldService.getMultiWorld(
                        multiSlot.multi_save_id
                    );
                    seedMatchesSave = multiDetails.seed_name === seedName;
                }

                if (!seedMatchesSave) {
                    let multiInfo =
                        MultiWorldService.findMatchingMultiWorld(seedName);
                    if (!multiInfo) {
                        multiInfo = MultiWorldService.createMultiWorldDetails({
                            seed_name: seedName,
                            connection_details: { host, port, password },
                        });
                    }
                    let slotInfo = MultiWorldService.getSlot(
                        multiInfo.multi_save_id,
                        slotNumber
                    );
                    if (!slotInfo) {
                        slotInfo = MultiWorldService.addSlot(
                            multiInfo.multi_save_id,
                            {
                                game,
                                slot_name: slotName,
                                slot_number: slotNumber,
                                slot_alias: this.client.players.self.alias,
                            }
                        );
                    }
                    multiSlot = {
                        multi_save_id: multiInfo.multi_save_id,
                        slot_number: slotNumber,
                    };
                }

                // resolve(MultiWorldService.getSlot(multiSlot.multi_save_id, slotNumber));
                // update time stamp
                MultiWorldService.updateSlot(
                    multiSlot.multi_save_id,
                    multiSlot.slot_number,
                    {}
                );

                this.#loadLocations();

                MultiWorldService.setLoadedSlot(
                    multiSlot.multi_save_id,
                    slotNumber
                );

                MultiWorldService.updateMultiWorld(multiSlot.multi_save_id, {
                    connection_details: { host, port, password },
                });

                const dataPackage = this.client.package.exportPackage();
                const getGroups = async (): Promise<{
                    item: { [name: string]: string[] };
                    location: { [name: string]: string[] };
                }> => {
                    // @ts-expect-error, typing error in archipelago.js
                    const locationGroups: { [groupName: string]: string[] } =
                        await this.client.storage
                            .fetchLocationNameGroups(game)
                            .then(
                                (a) => a[`_read_location_name_groups_${game}`]
                            );
                    // @ts-expect-error, typing error in archipelago.js
                    const itemGroups: { [groupName: string]: string[] } =
                        await this.client.storage
                            .fetchItemNameGroups(game)
                            .then((a) => a[`_read_item_name_groups_${game}`]);
                    const groups = {
                        item: itemGroups,
                        location: locationGroups,
                    };
                    return groups;
                };

                if (!MultiWorldService.loadedMultiWorld.data_package_details) {
                    const details: { [gameName: string]: string } = {};
                    Object.entries(dataPackage.games).forEach(
                        ([game, gamePackage]) => {
                            details[game] = gamePackage.checksum;
                        }
                    );
                    MultiWorldService.updateMultiWorld(
                        MultiWorldService.loadedMultiWorld.multi_save_id,
                        { data_package_details: details }
                    );
                }
                enableDataSync(this.client);
                let wrappedGamePackage: GamePackageWrapper = null;
                connectionStatusHandle.update({
                    message: "Loading data packages...",
                });
                await DataPackageHelper.getCachedPackage(
                    game,
                    dataPackage.games[game].checksum
                )
                    .then((gamePackage) => {
                        if (
                            !gamePackage ||
                            !gamePackage.item_groups ||
                            !gamePackage.location_groups
                        ) {
                            return getGroups().then((groups) => {
                                // no need to await saving
                                DataPackageHelper.cachePackage(
                                    dataPackage,
                                    groups,
                                    game
                                );
                                const a = {
                                    ...dataPackage.games[game],
                                    game,
                                    location_groups: groups.location,
                                    item_groups: groups.item,
                                };
                                return a;
                            });
                        }
                        return gamePackage;
                    })
                    .then((gamePackage) => {
                        wrappedGamePackage = new GamePackageWrapper(
                            gamePackage,
                            game
                        );
                    })
                    .catch((e) => console.error(e));
                const result: ConnectedEventParams = {
                    gamePackage: wrappedGamePackage,
                    slotName,
                    slotAlias: this.client.players.self.alias,
                    slotNumber: this.client.players.self.slot,
                    multiWorldId: multiSlot.multi_save_id,
                };
                this.#connectedCallbacks.forEach((callback) =>
                    callback(result)
                );
                connectionStatusHandle.update({
                    message: "Connected",
                    duration: 3,
                    type: MessageType.success,
                    progress: 1,
                });
                return result;
            })
            .catch((error) => {
                connectionStatusHandle.update({
                    message: "Connection failed",
                    duration: 3,
                    type: MessageType.error,
                    progress: 0,
                });
                this.client.socket.disconnect();
                this.#setStatus(ConnectionStatus.disconnected);
                const errorString = `\n\nOriginal Error:\n\t${error}`;
                if (error?.errors) {
                    const e = error.errors[0];
                    switch (e) {
                        case "InvalidSlot": {
                            NotificationManager.createToast({
                                message: `Failed to connect to slot. The slot name was invalid.`,
                                type: MessageType.warning,
                                details: `An Archipelago server was running at ${host}:${port}, but "${slotName}" was not a player in that server.
Please verify you have the correct slot details.${errorString}`,
                            });
                            return null;
                        }
                        default: {
                            NotificationManager.createToast({
                                message: "Failed to connect",
                                type: MessageType.error,
                                details: `Failed to connect to the slot for the following reason: ${e}.${errorString}`,
                            });
                            return null;
                        }
                    }
                } else if (["localhost", "127.0.0.1"].includes(host)) {
                    NotificationManager.createToast({
                        type: MessageType.error,
                        message: "Failed to connect to server",
                        details: `Failed to connect to your locally hosted server on port ${port}.\nPlease Verify the port is correct (visible in server console) and the server is running.${errorString}`,
                    });
                    return null;
                } else if (["archipelago.gg"].includes(host)) {
                    NotificationManager.createToast({
                        type: MessageType.error,
                        message: "Failed to connect to server",
                        details: `Failed to connect to the server on port ${port}.\nPlease Verify the port is correct and has not changed (visible on the room page).
You can restart the server by refreshing the room page if it has gone to sleep after 2 hours.${errorString}`,
                    });
                    return null;
                }
                const wssRequired = window?.location.protocol === "https:";
                NotificationManager.createToast({
                    type: MessageType.error,
                    message: "An unexpected error occurred",
                    details: `Failed to connect to the server at ${host}:${port}.\n\nPlease verify the host and port are correct and the server is running (check with your server host).
${wssRequired ? "\n\nNote this version of the app requires secure websockets (wss) to be enabled on the server, if you see a security related error below, that remote server may not be secured.\n\nUse the local download version of the app available on GitHub (link below)." : ""}
                    ${errorString}`,
                    action: wssRequired
                        ? () =>
                              window.open(
                                  "https://github.com/DrAwesome4333/ap-tracker#running-locally",
                                  "_blank"
                              )
                        : undefined,
                    actionName: wssRequired ? "Go to GitHub" : undefined,
                });
                return null;
            });
    };

    disconnect = () => {
        this.client.socket.disconnect();
    };

    #disconnectCallback = () => {
        this.#locations.clear();
        this.#items.clear();
        this.#setStatus(ConnectionStatus.disconnected);
    };

    locationUpdateHook = (callback: LocationUpdateCallback) => {
        this.#locationCallbacks.add(callback);
        callback([...this.#locations.values()]);
        return () => {
            this.#locationCallbacks.delete(callback);
        };
    };

    itemUpdateHook = (callback: ItemUpdateCallback) => {
        this.#itemCallbacks.add(callback);
        callback([...this.#items.values()]);
        return () => {
            this.#itemCallbacks.delete(callback);
        };
    };

    #loadLocations = () => {
        const checkedLocations = new Set(this.client.room.checkedLocations);
        const updates: LocationStatusUpdate[] =
            this.client.room.allLocations.map((locationId) => ({
                locationId,
                name: this.client.package.lookupLocationName(
                    this.client.game,
                    locationId
                ),
                checked: checkedLocations.has(locationId),
            }));
        this.#updateLocations(updates);
    };

    #updateLocations = (updates: LocationStatusUpdate[]) => {
        updates.forEach((update) => {
            const oldStatus = this.#locations.get(update.locationId) ?? {
                locationId: update.locationId,
                checked: false,
                ignored: false,
                name: "",
            };
            const newStatus = {
                ...oldStatus,
                ...update,
            };
            this.#locations.set(newStatus.locationId, newStatus);
            Object.freeze(newStatus);
        });
        this.#locationCallbacks.forEach((callback) => callback(updates));
    };

    #addItems = (items: Item[]) => {
        items.forEach((item) => this.#items.set(item.index, item));
        this.#itemCallbacks.forEach((callback) => callback(items));
    };

    get status() {
        return this.#status;
    }
}

export default APConnector;
export { ConnectionStatus };
export type { ConnectionConfiguration, ConnectedEventParams };
