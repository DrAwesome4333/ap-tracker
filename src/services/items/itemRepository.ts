import { ItemId, Item, ItemSource, ItemUpdateCallback } from "./itemSource";

class ItemRepository {
    #items: Item[] = [];
    #itemsById: Map<ItemId, Set<number>> = new Map();
    #listenerCallbacks: Map<Set<ItemId>, (items: Item[]) => void> = new Map();
    #updateCallbacks: Set<() => void> = new Set();
    #sourceCleanupCallbacks: WeakMap<ItemSource, () => void> = new WeakMap();
    #itemCache: Item[] = null;
    #itemsByIdCache: Map<ItemId, Item[]> = new Map();

    #callListeners = (items: Item[]) => {
        this.#listenerCallbacks.entries().forEach(([triggerIds, callback]) => {
            const itemIds = new Set(items.map((x) => x.itemId));
            let matchedItems = triggerIds.intersection(itemIds);
            if (matchedItems.size > 0) {
                const updates = items.filter((x) => matchedItems.has(x.itemId));
                callback(updates);
            }
        });
        this.#updateCallbacks.forEach((callback) => callback());
    };

    anyItemUpdateHook = (callback: () => void) => {
        this.#updateCallbacks.add(callback);
        return () => {
            this.#updateCallbacks.delete(callback);
        };
    };

    itemUpdateHook = (
        itemIds: ItemId | ItemId[],
        callback: (items: Item[]) => void
    ) => {
        const items = Array.isArray(itemIds)
            ? new Set(itemIds)
            : new Set([itemIds]);
        this.#listenerCallbacks.set(items, callback);
        return () => {
            this.#listenerCallbacks.delete(items);
        };
    };

    getAllItems = () => {
        if (this.#itemCache === null) {
            this.#itemCache = [...this.#items];
            Object.freeze(this.#itemCache);
        }
        return this.#itemCache;
    };

    getItemsByItemId = (id: ItemId) => {
        if (!this.#itemsByIdCache.get(id)) {
            const items = [...(this.#itemsById.get(id) ?? [])].map(
                (index) => this.#items[index]
            );
            Object.freeze(items);
            this.#itemsByIdCache.set(id, items);
        }
        return this.#itemsByIdCache.get(id);
    };

    addSource = (source: ItemSource) => {
        const sourceUpdateCallback: ItemUpdateCallback = (items) => {
            const newItems = items.filter(
                (item) => item.index >= this.#items.length
            );
            const proposedItems = [...this.#items, ...newItems];
            if (
                proposedItems.filter((x, index) => x.index !== index).length > 0
            ) {
                throw new Error(
                    "Item index error, item indexes did not line up as expected"
                );
            }
            newItems.forEach((item) => {
                const byId = this.#itemsById.get(item.itemId) ?? new Set();
                byId.add(item.index);
                this.#itemsById.set(item.itemId, byId);
            });
            this.#items = proposedItems;
            this.#itemCache = null;
            this.#callListeners(items);
        };
        const cleanupCallback = source.itemUpdateHook(sourceUpdateCallback);
        this.#sourceCleanupCallbacks.set(source, cleanupCallback);
    };

    // Removes listeners only, does not remove objects created by source
    cleanUpSource = (source: ItemSource) => {
        this.#sourceCleanupCallbacks.get(source)?.();
        this.#sourceCleanupCallbacks.delete(source);
    };
}

export default ItemRepository;
