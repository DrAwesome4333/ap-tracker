/** An item */
interface InventoryItem {
    name: string;
    id?: number;
    uuid: string;
    progression: boolean;
    useful: boolean;
    trap: boolean;
    index: number;
    location: string;
    sender: string;
    local: boolean;
}

class InventoryManager {
    #cachedItemReturn: InventoryItem[] = [];
    #cachedValueDirty = true;
    #subscribers: Set<() => void> = new Set();
    #items: InventoryItem[] = [];

    constructor() {}

    /** Clears all items from inventory */
    clear = () => {
        this.#cachedValueDirty = true;
        this.#items = [];
        this.#callSubscribers();
    };

    /** Adds one or more items to the inventory */
    addItem = (items: InventoryItem | InventoryItem[]) => {
        if (!Array.isArray(items)) {
            items = [items];
        }
        this.#items = [...this.#items, ...items];
        this.#cachedValueDirty = true;
        this.#callSubscribers();
    };

    /** Gets all item collections in inventory */
    getItems = (): InventoryItem[] => {
        if (this.#cachedValueDirty) {
            this.#cachedItemReturn = [...this.#items];
            this.#cachedValueDirty = false;
        }
        return this.#cachedItemReturn;
    };

    /** Returns a callback that can have a listener passed in and returns a clean up call to remove the listener*/
    getSubscriberCallback = () => {
        return (listener: () => void) => {
            this.#subscribers.add(listener);
            return () => {
                this.#subscribers.delete(listener);
            };
        };
    };

    #callSubscribers = () => {
        this.#subscribers.forEach((listener) => listener());
    };
}

export { InventoryManager };
export type { InventoryItem };
