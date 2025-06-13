import { DataStore, JSONValue } from "./dataStore";

/** Data that is not saved in a permanent location */
class TempDataStore implements DataStore {
    #value: JSONValue = null;
    #listeners: Map<string | undefined, Set<() => void>> = new Map();

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
        return itemName ? this.#value[itemName] : this.#value;
    };

    write = async (value: JSONValue, itemName?: string) => {
        if (
            itemName &&
            typeof this.#value === "object" &&
            !Array.isArray(this.#value)
        ) {
            const newValues: JSONValue = {
                ...this.#value,
                [itemName]: value,
            };
            Object.freeze(newValues);
            this.#value = newValues;
        } else if (typeof value === "object" && !Array.isArray(value)) {
            this.#value = {
                ...value,
            };
            Object.freeze(this.#value);
        } else {
            this.#value = value;
        }
        this.#callListeners(itemName);
    };

    delete = async (itemName?: string) => {
        let hasValue = false;
        if (
            itemName &&
            typeof this.#value === "object" &&
            !Array.isArray(this.#value)
        ) {
            const newData = {
                ...this.#value,
            };
            hasValue = this.#value[itemName] !== undefined;
            if (hasValue) {
                delete newData[itemName];
                this.#value = newData;
                Object.freeze(newData);
            }
        } else {
            hasValue = this.#value && true;
            this.#value = undefined;
        }

        if (hasValue) {
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

export default TempDataStore;
