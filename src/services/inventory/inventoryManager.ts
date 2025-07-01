import { randomUUID } from "../../utility/uuid";

enum ItemRoundingMode {
    /** Use {@link Math.ceil} for rounding*/
    up = "up",
    /** Use {@link Math.floor} for rounding*/
    down = "down",
    /** Use {@link Math.round} for rounding */
    mid = "mid",
    /** Do not round */
    none = "none",
}

type ItemGroupDef = (string | number)[] | CustomItemGroupDef;
type ItemGroupsDef = { [name: string]: ItemGroupDef };

interface CustomItemGroupDef {
    /** Optional display name, if undefined, the key of defining dictionary is used */
    name?: string;
    /** Configures how items are counted towards the final value */
    counter?: {
        /** How the display value should be rounded, defaults to {@link ItemRoundingMode.none}*/
        rounding?: ItemRoundingMode;
        /** What the initial value of this group is, defaults to 0*/
        initialValue?: number;
        /** If defined, the value for this item group will show as value/totalValue */
        totalValue?: number;
        /** If true, this item group will always show up, even if there are not any items in it yet */
        showAlways?: boolean;
    };
    /** A list of item names or ids that contribute to this group, by default each item contributes a value of 1 unless defined otherwise in {@link ItemGroupDef.values}*/
    items?: (string | number)[];
    /** Defines the value an item contributes to the counter, any items defined here are considered part of the {@link ItemGroupDef.items} list*/
    values?: { [item: string | number]: number };
    /** The version of the definition */
    version: 1;
}

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

/** An immutable collection of items */
interface InventoryItemCollection {
    /** A unique identity for this collection, mutations of the collection will copy this id */
    uuid: string;
    /** The display name of the collection */
    name: string;
    /** True if this collection has at least 1 progression item */
    progression: boolean;
    /** True if this collection has at least 1 useful item */
    useful: boolean;
    /** True if this collection has at least 1 trap item */
    trap: boolean;
    /** True if this collection has at least 1 item sent from the sever */
    fromServer: boolean;
    /** The latest index of the items in the collection */
    index: number;
    /** The value of the items in the collection */
    value: number;
    /** The total to display for this collection if defined, else no total is provided */
    total?: number;
    /** If true, this collection should be displayed  */
    show: boolean;
    /** List of items in the inventory */
    items: InventoryItem[];
    /** The worth of each item type in this collection, do not mutate after creation  */
    itemValueMap: Map<string | number, number>;
    /** The rounding mode for this collection */
    roundingMode: ItemRoundingMode;
}

const createInventoryCollection = (
    name: string,
    def: ItemGroupDef
): InventoryItemCollection => {
    const itemCollection: InventoryItemCollection = {
        name,
        progression: false,
        useful: false,
        trap: false,
        fromServer: false,
        index: 0,
        value: 0,
        show: false,
        items: [],
        itemValueMap: new Map(),
        roundingMode: ItemRoundingMode.none,
        uuid: randomUUID(),
    };

    if (Array.isArray(def)) {
        def.forEach((item) => itemCollection.itemValueMap.set(item, 1));
    } else {
        if (def.version !== 1) {
            throw `Invalid item group definition version ${def.version}, please fix the version number or update the app`;
        }
        itemCollection.name = def.name ?? name;
        itemCollection.value = def.counter?.initialValue ?? 0;
        itemCollection.show = def.counter.showAlways ?? false;
        itemCollection.roundingMode =
            def.counter?.rounding ?? ItemRoundingMode.none;
        itemCollection.total = def.counter?.totalValue;
        def.items?.forEach((item) => itemCollection.itemValueMap.set(item, 1));
        if (def.values) {
            for (const [item, value] of Object.entries(def.values)) {
                itemCollection.itemValueMap.set(item, value);
            }
        }
    }
    Object.freeze(itemCollection);
    Object.freeze(itemCollection.items);
    return itemCollection;
};

/**
 * Creates a new collection and tries to add the specified items to it
 * @param items The items to add
 * @param collection The collection to add the items to
 * @returns The new collection if items were added, the input collection if nothing changed.
 */
const addItemsToCollection = (
    items: InventoryItem[],
    collection: InventoryItemCollection
): InventoryItemCollection => {
    const newCollection: InventoryItemCollection = {
        ...collection,
    };

    const newItems: InventoryItem[] = [];
    items.forEach((item) => {
        if (
            collection.itemValueMap.has(item.id) ||
            collection.itemValueMap.has(item.name)
        ) {
            const value =
                collection.itemValueMap.get(item.name) ??
                collection.itemValueMap.get(item.id);
            newCollection.value += value;
            newItems.push(item);
            newCollection.progression ||= item.progression;
            newCollection.useful ||= item.useful;
            newCollection.trap ||= item.trap;
            newCollection.fromServer ||= item.sender === "Archipelago";
            newCollection.index = Math.max(newCollection.index, item.index);
        }
    });

    if (newItems.length === 0) {
        return collection;
    }

    newCollection.items = [...collection.items, ...newItems];
    Object.freeze(newCollection.items);
    Object.freeze(newCollection);
    return newCollection;
};

class InventoryManager {
    #collections: InventoryItemCollection[] = [];
    #cachedItemReturn: InventoryItemCollection[] = [];
    #cachedValueDirty = true;
    #subscribers: Set<() => void> = new Set();
    #itemGroupsDef: ItemGroupsDef;
    #items: InventoryItem[] = [];

    constructor() {}

    /**
     * Sets the item group definitions, resets collections
     * @param itemGroupsDef The definition of the groups
     * @param silent If true, will not trigger listeners when called. Defaults to false
     * @returns
     */
    setItemGroups = (itemGroupsDef: ItemGroupsDef, silent = false) => {
        this.#itemGroupsDef = itemGroupsDef;
        this.#collections = [];
        if (!itemGroupsDef) {
            return;
        }
        for (const [name, groupDef] of Object.entries(itemGroupsDef)) {
            let collection = createInventoryCollection(name, groupDef);
            collection = addItemsToCollection(this.#items, collection);
            this.#collections.push(collection);
        }
        this.#cachedValueDirty = true;
        if (!silent) {
            this.#callSubscribers();
        }
    };

    /** Clears all items from inventory */
    clear = () => {
        this.#cachedValueDirty = true;
        this.#items = [];
        this.setItemGroups(this.#itemGroupsDef, true);
        this.#callSubscribers();
    };

    /** Adds one or more items to the inventory */
    addItem = (items: InventoryItem | InventoryItem[]) => {
        if (!Array.isArray(items)) {
            items = [items];
        }
        this.#items = [...this.#items, ...items];
        const itemsInCollections: Set<InventoryItem> = new Set();
        this.#collections = this.#collections.map((collection) => {
            const result = addItemsToCollection(items, collection);
            result.items.forEach((item) => itemsInCollections.add(item));
            return result;
        });

        // Create new collections for items that did not find one
        let unplacedItems = items.filter(
            (item) => !itemsInCollections.has(item)
        );
        while (unplacedItems.length > 0) {
            const item = unplacedItems[0];
            const groupDef = createItemGroupDefFromItem(item);
            let collection = createInventoryCollection(item.name, groupDef);
            collection = addItemsToCollection(unplacedItems, collection);
            collection.items.forEach((item) => itemsInCollections.add(item));
            this.#collections.push(collection);
            unplacedItems = items.filter(
                (item) => !itemsInCollections.has(item)
            );
        }

        this.#cachedValueDirty = true;
        this.#callSubscribers();
    };

    /** Gets all item collections in inventory */
    getItems = (): InventoryItemCollection[] => {
        if (this.#cachedValueDirty) {
            this.#cachedItemReturn = [...this.#collections];
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

const createItemGroupDefFromItem = (item: InventoryItem): ItemGroupDef => {
    return [item.name];
};

export { InventoryManager, ItemRoundingMode };
export type {
    InventoryItemCollection,
    InventoryItem,
    ItemGroupDef,
    ItemGroupsDef,
};
