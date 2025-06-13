import {
    DataStore,
    JSONValue,
    LocalStorageDataStore,
    TempDataStore,
} from "../dataStores";
import { OptionType, Option } from "./option";
import { baseTrackerOptions } from "./trackerOptions";
const OPTION_LOCAL_STORAGE_ITEM_NAME: string = "AP_CHECKLIST_TRACKER_OPTIONS";
const DEBUG: boolean = false;

class OptionManager {
    #optionSubscribers: Map<string, Map<string, Set<() => void>>>;
    #defaults: Map<string, Map<string, JSONValue>>;
    #scopes: Map<string, { store: DataStore; cleanUp: () => void }> = new Map();

    constructor() {
        this.#optionSubscribers = new Map();
        this.#defaults = new Map();
    }

    #callListeners = (scope: string, optionName?: string) => {
        if (optionName) {
            this.#optionSubscribers
                .get(scope)
                ?.get(optionName)
                ?.forEach((listener) => {
                    listener();
                });
        } else {
            this.#optionSubscribers
                .get(scope)
                ?.forEach((optionListeners) =>
                    optionListeners.forEach((listener) => listener())
                );
        }
    };
    /**
     * Creates a callback that can be used to subscribe changes in an option.
     * @param optionName The name of the option to listen to
     * @param scope The name of the scope thd option is tied to
     * @returns A callback that accepts a listener and returns a clean up method.
     */
    getSubscriberCallback = (
        optionName: string,
        scope: string
    ): ((listener: () => void) => () => void) => {
        return (listener: () => void): (() => void) => {
            // Ensure there is a map of sets of listeners set up for that scope
            const optionScopeListeners: Map<
                string,
                Set<() => void>
            > = this.#optionSubscribers.get(scope) ?? new Map();
            this.#optionSubscribers.set(scope, optionScopeListeners);

            // Add the listener for the option to the scope
            const optionListeners: Set<() => void> =
                optionScopeListeners.get(optionName) ?? new Set();
            optionScopeListeners.set(optionName, optionListeners);
            optionListeners.add(listener);

            if (DEBUG && this.getOptionValue(optionName, scope) === null) {
                console.info(
                    `The option <${scope}.${optionName}> was subscribed to, but does not exist yet. Safe to ignore this message if you plan on adding it later`
                );
            }
            return () => {
                this.#optionSubscribers
                    .get(scope)
                    ?.get(optionName)
                    ?.delete(listener);
            };
        };
    };

    /**
     * Retrieves the current value stored for an option in a given scope
     * @param optionName The name of the option to get
     * @param scope The scope that option is contained in
     * @returns The value of the option, null if no value was found
     */
    getOptionValue = (optionName: string, scope: string): JSONValue => {
        const value =
            this.#scopes.get(scope)?.store.read(optionName) ??
            this.#defaults.get(scope)?.get(optionName) ??
            null;
        if (DEBUG) {
            console.info(`Retrieved option ${scope}.${optionName} as ${value}`);
        }
        return value;
    };

    /**
     * Sets the value of an option in a given scope
     * @param optionName The name of the option to get
     * @param scope The scope that option is contained in
     * @param value The value to set for that option
     */
    setOptionValue = (
        optionName: string,
        scope: string,
        value: JSONValue
    ): void => {
        const optionScope = this.#scopes.get(scope);
        if (!optionScope) {
            throw new Error(`Scope ${scope} is not configured!`);
        }
        if (value === null) {
            optionScope.store.delete(optionName);
        } else {
            optionScope.store.write(value, optionName);
        }

        if (DEBUG) {
            console.info(`Set option ${scope}.${optionName} to ${value}`);
        }
    };

    /**
     * Sets the default value of an option in a given scope
     * @param optionName The name of the option to get
     * @param scope The scope that option is contained in
     * @param value The default value to set for that option
     */
    setOptionDefault = (
        optionName: string,
        scope: string,
        value: JSONValue
    ): void => {
        const defaultOptionScope = this.#defaults.get(scope) ?? new Map();
        this.#defaults.set(scope, defaultOptionScope);
        if (value === null) {
            defaultOptionScope.delete(optionName);
        } else {
            defaultOptionScope.set(optionName, value);
        }

        this.#callListeners(scope, optionName);

        if (DEBUG) {
            console.info(
                `Set option default ${scope}.${optionName} to ${value}`
            );
        }
    };

    /**
     * Sets up the backend used for the scope
     * @param scopeName The name of the scope to configure
     * @param dataStore The data store to use, must implement getUpdateSubscriber
     */
    configureScope = (scopeName: string, dataStore: DataStore) => {
        const currentScope = this.#scopes.get(scopeName);
        if (currentScope) {
            currentScope.cleanUp();
        }
        const subscriber = dataStore.getUpdateSubscriber();
        const updateCallback = () => {
            this.#callListeners(scopeName);
        };
        const cleanUp = subscriber(updateCallback);
        this.#scopes.set(scopeName, {
            store: dataStore,
            cleanUp,
        });

        this.#callListeners(scopeName);
    };

    /**
     * Deletes all values from the scope
     * @param scope
     */
    clearScope = (scope: string) => {
        this.#scopes.get(scope)?.store.write({});
    };
}

const globalOptionManager = new OptionManager();
const globalOptionStore = new LocalStorageDataStore(
    OPTION_LOCAL_STORAGE_ITEM_NAME
);

const parseOption = (option: Option, parent?: JSONValue) => {
    if (option.type !== OptionType.hierarchical) {
        if (parent) {
            parent[option.name] = option.default;
        } else {
            globalOptionManager.setOptionDefault(
                option.name,
                "global",
                option.default
            );
        }
    } else {
        const value = {};
        option.children.forEach((child) => parseOption(child, value));
        if (parent) {
            parent[option.name] = value;
        } else {
            globalOptionManager.setOptionDefault(option.name, "global", value);
        }
    }
};

Object.entries(baseTrackerOptions).forEach(([_name, option]) =>
    parseOption(option)
);

globalOptionManager.configureScope("global", globalOptionStore);
globalOptionManager.configureScope("temp", new TempDataStore());

export { globalOptionManager, OptionManager };
