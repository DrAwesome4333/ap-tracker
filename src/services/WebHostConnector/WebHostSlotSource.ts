import { itemClassifications } from "archipelago.js";
import { GamePackageWrapper } from "../gamepackage/GamePackageWrapper";
import { Item, ItemSource, ItemUpdateCallback } from "../items/itemSource";
import {
    LocationSource,
    LocationStatus,
    LocationUpdateCallback,
} from "../locations/locationSource";
import {
    APIOffsets_Item,
    APIRoomStatus,
    APIStaticTracker,
    APITracker,
} from "../WebHostAPI/types";

class WebHostSlotSource implements LocationSource, ItemSource {
    #players: Record<number, { name: string; game: string }>;
    #slotNumber: number;
    #teamNumber: number;
    // #clearedLocations: Set<Number> = new Set();
    #locationStatuses: LocationStatus[] = [];
    #items: Item[] = [];
    #itemIndex = 0;
    #gamePackages: Record<string, GamePackageWrapper>;
    #game: string;

    #locationListeners: Set<LocationUpdateCallback> = new Set();
    #itemListeners: Set<ItemUpdateCallback> = new Set();

    constructor(
        gamePackages: Record<string, GamePackageWrapper>,
        game: string,
        players: Record<number, { name: string; game: string }>,
        slot: number,
        team: number = 0
    ) {
        this.#slotNumber = slot;
        this.#gamePackages = gamePackages;
        this.#teamNumber = team;
        this.#game = game;
        this.#players = players;
    }

    locationUpdateHook = (callback: LocationUpdateCallback) => {
        this.#locationListeners.add(callback);
        callback(this.#locationStatuses);
        return () => this.#locationListeners.delete(callback);
    };

    itemUpdateHook = (callback: ItemUpdateCallback) => {
        this.#itemListeners.add(callback);
        callback(this.#items);
        return () => this.#itemListeners.delete(callback);
    };

    refresh = (apiData: APITracker) => {
        // console.log("Refresh");
        if (!this.#players) {
            apiData.aliases;
        }
        const slotItems = apiData.player_items_received.find(
            (slot) =>
                slot.player === this.#slotNumber &&
                slot.team === this.#teamNumber
        ).items;

        // TODO, when all locations can be fetched via the API, do so
        // TODO, hints

        const newItems: Item[] = slotItems
            .slice(this.#itemIndex)
            .map((apiItem, relativeIndex) => ({
                itemId: apiItem[APIOffsets_Item.itemId],
                name: this.#gamePackages[this.#game].getItemName(
                    apiItem[APIOffsets_Item.itemId]
                ),
                index: this.#itemIndex + relativeIndex,
                locationId: apiItem[APIOffsets_Item.locationId],
                location: this.#gamePackages[
                    this.#players[apiItem[APIOffsets_Item.slotNumber]].game
                ].getLocationName(apiItem[APIOffsets_Item.locationId]),
                senderSlot: apiItem[APIOffsets_Item.slotNumber],
                sender: this.#players[apiItem[APIOffsets_Item.slotNumber]].name,
                flags: {
                    progression:
                        apiItem[APIOffsets_Item.itemFlags] &
                            itemClassifications.progression && true,
                    useful:
                        apiItem[APIOffsets_Item.itemFlags] &
                            itemClassifications.useful && true,
                    trap:
                        apiItem[APIOffsets_Item.itemFlags] &
                            itemClassifications.trap && true,
                    local:
                        apiItem[APIOffsets_Item.slotNumber] ===
                        this.#slotNumber,
                    server: apiItem[APIOffsets_Item.slotNumber] === 0,
                },
            }));
        this.#items = [...this.#items, ...newItems];
        this.#itemListeners.forEach((callback) => callback(newItems));
        this.#itemIndex = slotItems.length;
    };

    static buildPlayersForRoom = (roomStatus: APIRoomStatus) => {
        const players: Record<number, { name: string; game: string }> = {
            0: {
                name: "Server",
                game: "Archipelago",
            },
        };
        roomStatus.players.forEach(([slotName, playerGame], index) => {
            // TODO verify this with item links
            players[index + 1] = {
                name: slotName,
                game: playerGame,
            };
        });
        return players;
    };
}

export default WebHostSlotSource;
