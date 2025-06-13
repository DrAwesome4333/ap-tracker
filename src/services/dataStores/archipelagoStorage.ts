import { Client, JSONSerializable } from "archipelago.js";
import { DataStore, JSONValue } from "./dataStore";

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
         * on a data storage key. So we just tell it to not retrigger on reconnect.
         */
        this.#client.socket.off("connected", this.#setupAPListeners);
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

    get key() {
        return this.#dataStorageKey;
    }
}

export default ArchipelagoDataStore;
