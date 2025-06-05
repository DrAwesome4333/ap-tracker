import { JSONValue } from "../dataStores";
const OPTION_LOCAL_STORAGE_ITEM_NAME: string = "archipelagoTrackerOptionData";
const DEBUG: boolean = false;

class OptionManager {
    #optionSubscribers: Map<string, Map<string, Set<() => void>>>;
    #options: Map<string, Map<string, JSONValue>>;
    #defaults: Map<string, Map<string, JSONValue>>;

    constructor() {
        this.#optionSubscribers = new Map();
        this.#options = new Map();
        this.#defaults = new Map();
    }

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
            this.#options.get(scope)?.get(optionName) ??
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
        const optionScope = this.#options.get(scope) ?? new Map();
        this.#options.set(scope, optionScope);
        if (value === null) {
            optionScope.delete(optionName);
        } else {
            optionScope.set(optionName, value);
        }

        // call listeners
        this.#optionSubscribers
            .get(scope)
            ?.get(optionName)
            ?.forEach((listener) => {
                listener();
            });
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
        const optionScope = this.#defaults.get(scope) ?? new Map();
        this.#defaults.set(scope, optionScope);
        if (value === null) {
            optionScope.delete(optionName);
        } else {
            optionScope.set(optionName, value);
        }

        // call listeners
        this.#optionSubscribers
            .get(scope)
            ?.get(optionName)
            ?.forEach((listener) => {
                listener();
            });
        if (DEBUG) {
            console.info(
                `Set option default ${scope}.${optionName} to ${value}`
            );
        }
    };

    /**
     * Exports the scope to a JSON object.
     * @param scope The scope to export
     * @returns JSON version of data
     */
    exportScope = (scope: string): { [option: string]: JSONValue } => {
        const result = {};
        for (const option of (this.#options.get(scope) ?? new Map()).keys()) {
            result[option] = this.#options.get(scope)?.get(option);
            if (Array.isArray(result[option])) {
                result[option] = [...result[option]];
            }
        }
        return result;
    };

    /**
     * Saves the scope to a local store for that scope. Use only for options intended
     * to be global for that scope. (example is user settings)
     * @param scope
     */
    saveScope = (scope: string): void => {
        const saveDataString = localStorage.getItem(
            OPTION_LOCAL_STORAGE_ITEM_NAME
        );
        const saveData = saveDataString ? JSON.parse(saveDataString) : {};
        saveData[scope] = this.exportScope(scope);
        localStorage.setItem(
            OPTION_LOCAL_STORAGE_ITEM_NAME,
            JSON.stringify(saveData)
        );
        if (DEBUG) {
            console.info(`Saved scope ${scope}`);
        }
    };
    /**
     * Loads a saved scope from a local store for that scope. Use only for options intended
     * to be global for that scope. (example is a user setting)
     * @param scope
     */
    loadScope = (scope: string): void => {
        const saveDataString = localStorage.getItem(
            OPTION_LOCAL_STORAGE_ITEM_NAME
        );
        const saveData = saveDataString ? JSON.parse(saveDataString) : {};
        if (Object.hasOwn(saveData, scope)) {
            const scopeData = saveData[scope];
            this.setScope(scope, scopeData);
            if (DEBUG) {
                console.info(`Loaded scope ${scope}`);
            }
        } else if (DEBUG) {
            console.info(`Failed to load scope ${scope}`);
        }
    };

    /**
     * Sets the values for a given scope from an external source
     * does not remove existing values in the scope, but will overwrite them
     * if they exist in the scope already.
     * Calls appropriate listeners.
     * @param scope
     * @param values
     */
    setScope = (scope: string, values: { [option: string]: JSONValue }) => {
        for (const optionName of Object.getOwnPropertyNames(values)) {
            this.setOptionValue(optionName, scope, values[optionName]);
        }
    };

    /**
     * Deletes all values from the scope
     * @param scope
     */
    clearScope = (scope: string) => {
        this.#options.delete(scope);
        this.#optionSubscribers.get(scope)?.forEach((optionSubscribers) => {
            optionSubscribers.forEach((listener) => {
                listener();
            });
        });
    };
}

const globalOptionManager = new OptionManager();
globalOptionManager.loadScope("global");

export { globalOptionManager, OptionManager };
