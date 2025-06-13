import { DataStore, JSONValue } from "./dataStore";
/** Implements a data store using local storage */
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

    get key() {
        return this.#storageKey;
    }
}

export default LocalStorageDataStore;
