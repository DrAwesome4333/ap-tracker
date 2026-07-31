import { itemClassifications } from "archipelago.js";
import { Item, ItemSource, ItemUpdateCallback } from "../items/itemSource";
import {
    LocationSource,
    LocationStatus,
    LocationUpdateCallback,
} from "../locations/locationSource";
import { APIOffsets_Item, APITracker } from "../WebHostAPI/types";
import { MultiWorldContextData } from "../MultiInfo/MultiWorldContextData";

class WebHostSlotSource implements LocationSource, ItemSource {
    #context: MultiWorldContextData;
    #slotNumber: number;
    #teamNumber: number;
    // #clearedLocations: Set<Number> = new Set();
    #locationStatuses: LocationStatus[] = [];
    #items: Item[] = [];
    #itemIndex = 0;
    #game: string;

    #locationListeners: Set<LocationUpdateCallback> = new Set();
    #itemListeners: Set<ItemUpdateCallback> = new Set();

    constructor(
        multiWorldContext: MultiWorldContextData,
        game: string,
        slot: number,
        team: number = 0
    ) {
        this.#context = multiWorldContext;
        this.#slotNumber = slot;
        this.#teamNumber = team;
        this.#game = game;
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
        if (!this.#context?.players) {
            return;
        }
        const slotItems = apiData.player_items_received.find(
            (slot) =>
                slot.player === this.#slotNumber &&
                slot.team === this.#teamNumber
        ).items;

        // TODO, when all locations can be fetched via the API, do so

        const newItems: Item[] = slotItems
            .slice(this.#itemIndex)
            .map((apiItem, relativeIndex) => ({
                itemId: apiItem[APIOffsets_Item.itemId],
                name: this.#context.gamePackages[this.#game].getItemName(
                    apiItem[APIOffsets_Item.itemId]
                ),
                index: this.#itemIndex + relativeIndex,
                locationId: apiItem[APIOffsets_Item.locationId],
                location: this.#context.gamePackages[
                    this.#context.players[apiItem[APIOffsets_Item.slotNumber]]
                        .game
                ].getLocationName(apiItem[APIOffsets_Item.locationId]),
                senderSlot: apiItem[APIOffsets_Item.slotNumber],
                sender: this.#context.players[
                    apiItem[APIOffsets_Item.slotNumber]
                ].name,
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
}

export default WebHostSlotSource;
