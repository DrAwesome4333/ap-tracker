import { Client, JSONSerializable } from "archipelago.js";
type JSONValue =
    | string
    | number
    | boolean
    | null
    | { [property: string]: JSONValue }
    | JSONValue[];

interface DataStore {
    /** Retrieves a value from the store. Returns the value if it exists or undefined if it does not. If itemName is left undefined, whole store is returned */
    read: (itemName?: string) => JSONValue;
    /** Writes a value to the store., If item is undefined, whole store is overwritten */
    write: (value: JSONValue, itemName?: string) => Promise<void>;
    /** Removes a value from the store or the whole store if itemName is undefined, returns true if the value existed else false */
    delete: (itemName?: string) => Promise<boolean>;
    /** Returns a callback that can be used to pass a listener to subscribe to the specified item. That call back returns a clean up call to remove the listener.
     * This may not be defined depending on how the store works.
     */
    getUpdateSubscriber?: (
        itemName?: string
    ) => (listener: () => void) => () => void;

    /** Call this once the data store is no longer needed*/
    cleanup: () => void;
}

// /** Implements a data store using local storage */
class LocalStorageDataStore implements DataStore {
    #storageKey: string;
    #listeners: Map<string | undefined, Set<() => void>> = new Map();
    #values: { [itemName: string]: JSONValue };
    #lastModified: number;

    constructor(key: string) {
        this.#storageKey = key;
        this.#loadValues();
    }

    /** Load #values from local storage */
    #loadValues = () => {
        const dataString = localStorage.getItem(this.#storageKey);
        this.#values = dataString ? JSON.parse(dataString) : {};
        this.#lastModified = Number(
            localStorage.getItem(`${this.#storageKey}-modified`) ?? Date.now()
        );
        Object.freeze(this.#values);
    };

    /** Store #values to local storage */
    #saveValues = () => {
        localStorage.setItem(this.#storageKey, JSON.stringify(this.#values));
        localStorage.setItem(
            `${this.#storageKey}-modified`,
            this.#lastModified.toString()
        );
    };

    /** Calls all listeners listening the the given item */
    #callListeners = (itemName?: string) => {
        if (itemName) {
            this.#listeners.get(itemName)?.forEach((listener) => listener());
            this.#listeners.get(undefined)?.forEach((listener) => listener());
        } else {
            // Call all listeners
            this.#listeners.forEach((listeners) =>
                listeners.forEach((listener) => listener())
            );
        }
    };

    read = (itemName?: string) => {
        const lastModified = Number(
            localStorage.getItem(`${this.#storageKey}-modified`)
        );
        if (!Number.isNaN(lastModified) && lastModified > this.#lastModified) {
            this.#loadValues();
        }
        return itemName ? this.#values[itemName] : this.#values;
    };

    write = async (value: JSONValue, itemName?: string) => {
        const lastModified = Number(
            localStorage.getItem(`${this.#storageKey}-modified`)
        );
        if (!Number.isNaN(lastModified) && lastModified > this.#lastModified) {
            this.#loadValues();
        }

        if (itemName) {
            const newValues: JSONValue = {
                ...this.#values,
                [itemName]: value,
            };
            Object.freeze(newValues);
            this.#values = newValues;
        } else if (typeof value === "object" && !Array.isArray(value)) {
            this.#values = {
                ...value,
            };
            Object.freeze(this.#values);
        } else {
            throw "Local storage data store must be replaced with a JSON object, not a singular value";
        }
        this.#lastModified = Date.now();
        this.#saveValues();
        this.#callListeners(itemName);
    };

    delete = async (itemName?: string) => {
        const lastModified = Number(
            localStorage.getItem(`${this.#storageKey}-modified`)
        );
        if (!Number.isNaN(lastModified) && lastModified > this.#lastModified) {
            this.#loadValues();
        }

        let hasValue = false;
        let newData = {
            ...this.#values,
        };
        if (itemName) {
            hasValue = this.#values[itemName] !== undefined;
            if (hasValue) {
                delete newData[itemName];
            }
        } else {
            newData = {};
        }

        if (hasValue) {
            this.#lastModified = Date.now();
            this.#values = newData;
            Object.freeze(newData);
            this.#saveValues();
            this.#callListeners(itemName);
        }
        return hasValue;
    };
    /** There is no clean up to do with this data store */
    cleanup = () => {};

    getUpdateSubscriber = (
        itemName?: string
    ): ((listener: () => void) => () => void) => {
        return (listener) => {
            const listeners = this.#listeners.get(itemName) ?? new Set();
            listeners.add(listener);
            this.#listeners.set(itemName, listeners);
            return () => {
                this.#listeners.get(itemName)?.delete(listener);
            };
        };
    };
}

class ArchipelagoDataStore implements DataStore {
    #client: Client;
    #listeners: Map<string | undefined, Set<() => void>> = new Map();
    #value: JSONValue = null;
    #dataStorageKey: string;

    constructor(dataStorageKey: string, client: Client) {
        this.#client = client;
        this.#dataStorageKey = dataStorageKey;
        client.socket.on("connected", this.#setupAPListeners);
        if (client.authenticated) {
            this.#setupAPListeners();
        }
    }

    #setupAPListeners = () => {
        this.#client.storage
            .notify([this.#dataStorageKey], this.#update)
            .then((value) => {
                this.#value = value[this.#dataStorageKey];
                Object.freeze(this.#value);
                this.#callListeners();
            });
    };

    #callListeners = (itemName?: string) => {
        if (itemName) {
            this.#listeners.get(itemName)?.forEach((listener) => listener());
            this.#listeners.get(undefined)?.forEach((listener) => listener());
        } else {
            this.#listeners.forEach((listeners) =>
                listeners.forEach((listener) => listener())
            );
        }
    };

    #update = (
        _key: string,
        newValue: JSONSerializable,
        _oldValue?: JSONSerializable
    ) => {
        this.#value = newValue;
        Object.freeze(newValue);
        this.#callListeners();
    };

    cleanup = () => {
        /**
         * Archipelago.js does not provide a way to stop listening for changes
         * on a data storage key. So no clean up can be done really.
         */
    };

    read = (itemName?: string) => {
        // debugger;
        if (itemName) {
            return this.#value ? this.#value[itemName] : undefined;
        } else {
            return this.#value;
        }
    };

    write = async (value: JSONValue, itemName?: string) => {
        if (!this.#client.authenticated) {
            throw new Error(
                "Cannot write to archipelago if client is not connected."
            );
        }
        // update a dictionary
        if (itemName) {
            await this.#client.storage
                .prepare(this.#dataStorageKey, {})
                .update({ [itemName]: value })
                .commit(true);
        } else {
            await this.#client.storage
                .prepare(this.#dataStorageKey, {})
                .replace(value)
                .commit(true);
        }
    };

    delete = async (itemName?: string) => {
        if (!this.#client.authenticated) {
            throw new Error(
                "Cannot write to archipelago if client is not connected"
            );
        }
        if (
            itemName &&
            typeof this.#value === "object" &&
            !Array.isArray(this.#value)
        ) {
            const newData = { ...this.#value };
            const hasValue = Object.hasOwn(newData, itemName);
            delete newData[itemName];
            await this.#client.storage
                .prepare(this.#dataStorageKey, {})
                .update({ itemName: undefined })
                .commit(true);
            return hasValue;
        } else {
            await this.#client.storage
                .prepare(this.#dataStorageKey, {})
                .replace(null)
                .commit(true);
            return this.#value && true;
        }
    };

    getUpdateSubscriber = (
        itemName?: string
    ): ((listener: () => void) => () => void) => {
        return (listener) => {
            const listeners = this.#listeners.get(itemName) ?? new Set();
            listeners.add(listener);
            this.#listeners.set(itemName, listeners);
            return () => {
                this.#listeners.get(itemName)?.delete(listener);
            };
        };
    };
}

export { LocalStorageDataStore, ArchipelagoDataStore };

export type { JSONValue, DataStore };
