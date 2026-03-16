import { API, Client } from "archipelago.js";
import { Item, ItemSource, ItemUpdateCallback } from "../items/itemSource";
import {
    LocationStatus,
    LocationId,
    LocationSource,
    LocationUpdateCallback,
    LocationStatusUpdate,
} from "../locations/locationSource";
import { ConnectorValidationError } from "./connectorMessages";
import MultiWorldContext, {
    SavedSlotDetails,
} from "../MultiInfo/MultiWorldContext";
import { LocalStorageDataStore } from "../dataStores";
import { randomUUID } from "../../utility/uuid";
import { GamePackageWrapper } from "../gamepackage/GamePackageWrapper";
import { enableDataSync } from "./remoteSync";
import DataPackageHelper from "../MultiInfo/DatapackageHelper";
import TextClientManager from "../textClientManager";
import { setupAPTextSync } from "./textSync";
import GenericTrackerRepository from "../tracker/generic/genericTrackerRepository";
import { TrackerManager } from "../tracker/TrackerManager";
import HintManager from "../HintManager";
import { LocationTagger } from "../tags/LocationTagger";

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
    genericTrackerRepository: GenericTrackerRepository;
    trackerManager: TrackerManager;
    hintManager: HintManager;
    locationTagger: LocationTagger;
};

const clientUuidStore = new LocalStorageDataStore("ap-checklist-client-uuid");

class APConnector implements LocationSource, ItemSource {
    readonly client: Client = null;

    #status: ConnectionStatus = ConnectionStatus.disconnected;
    #clientUuid: string = null;
    #statusChangeCallbacks: Set<() => void> = new Set();
    #locationCallbacks: Set<LocationUpdateCallback> = new Set();
    #itemCallbacks: Set<ItemUpdateCallback> = new Set();
    #locations: Map<LocationId, LocationStatus> = new Map();
    #items: Map<number, Item> = new Map();
    #genericTrackerRepository: GenericTrackerRepository;
    #hintManager: HintManager;
    #locationTagger: LocationTagger;
    #trackerManager: TrackerManager;

    constructor({
        textClientManager,
        genericTrackerRepository,
        trackerManager,
        hintManager,
        locationTagger,
    }: APConnectorParams) {
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
        this.#genericTrackerRepository = genericTrackerRepository;
        this.#trackerManager = trackerManager;
        this.#hintManager = hintManager;
        this.#locationTagger = locationTagger;
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

    connect = async (config: ConnectionConfiguration) => {
        if (this.status === ConnectionStatus.connected) {
            throw new Error("Tracker already connected.", {
                cause: ConnectorValidationError.alreadyConnected,
            });
        }
        if (this.status === ConnectionStatus.connecting) {
            throw new Error("Tracker already connecting.", {
                cause: ConnectorValidationError.alreadyConnecting,
            });
        }

        let multiSlot = config.multi_slot;
        let host = config.host;
        let port = config.port;
        let password = config.password;
        let slotName = config.slot_name;

        if (multiSlot) {
            const multiWorldInfo = MultiWorldContext.getMultiWorld(
                multiSlot.multi_save_id
            );
            const slotInfo = MultiWorldContext.getSlot(
                multiSlot.multi_save_id,
                multiSlot.slot_number
            );
            if (!multiWorldInfo || !slotInfo) {
                throw new Error(
                    `Could not find slot info for multi world ${multiSlot.multi_save_id} slot ${multiSlot.slot_number}`,
                    { cause: ConnectorValidationError.slotNotFound }
                );
            }
            ({ host, port, password } = multiWorldInfo.connection_details);
            slotName = slotInfo.slot_name;
        }

        if (host.trim().length === 0) {
            throw new Error("Please provide a host name", {
                cause: ConnectorValidationError.invalidHost,
            });
        }

        if (slotName.trim().length === 0) {
            throw new Error("Please provide a slot name", {
                cause: ConnectorValidationError.invalidSlotName,
            });
        }

        if (!port) {
            port = "38281";
        }

        this.#setStatus(ConnectionStatus.connecting);

        await this.client
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
                    const multiDetails = MultiWorldContext.getMultiWorld(
                        multiSlot.multi_save_id
                    );
                    seedMatchesSave = multiDetails.seed_name === seedName;
                }

                if (!seedMatchesSave) {
                    let multiInfo =
                        MultiWorldContext.findMatchingMultiWorld(seedName);
                    if (!multiInfo) {
                        multiInfo = MultiWorldContext.createMultiWorldDetails({
                            seed_name: seedName,
                            connection_details: { host, port, password },
                        });
                    }
                    let slotInfo = MultiWorldContext.getSlot(
                        multiInfo.multi_save_id,
                        slotNumber
                    );
                    if (!slotInfo) {
                        slotInfo = MultiWorldContext.addSlot(
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
                // resolve(MultiWorldContext.getSlot(multiSlot.multi_save_id, slotNumber));
                // update time stamp
                MultiWorldContext.updateSlot(
                    multiSlot.multi_save_id,
                    multiSlot.slot_number,
                    {}
                );

                this.#loadLocations();

                MultiWorldContext.setLoadedSlot(
                    multiSlot.multi_save_id,
                    slotNumber
                );

                const dataPackage = this.client.package.exportPackage();
                const getGroups = async (): Promise<{
                    item: { [name: string]: string[] };
                    location: { [name: string]: string[] };
                }> => {
                    console.log("pulling groups");
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
                enableDataSync(this.client);

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
                            return getGroups()
                                .then((groups) => {
                                    return DataPackageHelper.cachePackage(
                                        dataPackage,
                                        groups,
                                        game
                                    );
                                })
                                .then(() =>
                                    DataPackageHelper.getCachedPackage(
                                        game,
                                        dataPackage.games[game].checksum
                                    )
                                );
                        }
                        return gamePackage;
                    })
                    .then((gamePackage) => {
                        const wrappedPackage = new GamePackageWrapper(
                            gamePackage,
                            game
                        );
                        this.#genericTrackerRepository.configureGenericTrackers(
                            wrappedPackage
                        );
                        this.#trackerManager.loadTrackers(game, wrappedPackage);
                    })
                    .catch((e) => console.error(e));

                this.#locationTagger?.loadTags(
                    MultiWorldContext.loadedMultiWorld.multi_save_id,
                    MultiWorldContext.loadedSlot.slot_number
                );
            })
            .catch((error) => {
                this.client.socket.disconnect();
                this.#setStatus(ConnectionStatus.disconnected);
                throw error;
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
export type { ConnectionConfiguration };
