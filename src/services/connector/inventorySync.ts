import { Client, Item } from "archipelago.js";
import { InventoryItem, InventoryManager } from "../inventory/inventoryManager";

const convertAPItem = (
    client: Client,
    item: Item,
    index: number
): InventoryItem => {
    return {
        name: item.name,
        id: item.id,
        uuid: crypto.randomUUID(),
        progression: item.progression,
        useful: item.useful,
        trap: item.trap,
        index,
        location: item.locationName,
        sender: item.sender.alias,
        local: item.sender.slot === client.players.self.slot,
    };
};

const setupAPInventorySync = (
    client: Client,
    inventoryManger: InventoryManager
) => {
    inventoryManger.clear();
    client.items.on("itemsReceived", (items, startIndex) => {
        const inventoryItems = items.map((item, index) =>
            convertAPItem(client, item, startIndex + index)
        );
        inventoryManger.addItem(inventoryItems);
    });
};

export { setupAPInventorySync };
