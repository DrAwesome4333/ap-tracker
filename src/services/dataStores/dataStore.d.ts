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

export type { JSONValue, DataStore };
