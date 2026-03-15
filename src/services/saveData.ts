const DB_STORE_KEYS = {
    dataPackageCache: "data_package_cache",
    // groupCache: "cached_groups_v2.1",
    customTrackers: "custom_trackers_v2",
    customTrackersDirectory: "custom_tracker_manifests_v2",
    tags: "tag_data",
};

const retiredKeys = [
    "data_packages",
    "location_groups",
    "cached_groups",
    "custom_trackers",
    "cached_groups_v2",
    //"cached_groups_v2.1", add for final launch
];

const database_request = window.indexedDB.open("checklist_db", 13);
let database_open = false;
let queuedEvents: (() => void)[] = [];

database_request.onerror = () => {
    console.error("Data base error: ");
    console.error(database_request.error);
};

database_request.onsuccess = () => {
    database_open = true;
    queuedEvents.forEach((event) => event());
    queuedEvents = [];
};

database_request.onblocked = () => {
    console.warn("Database operation blocked");
};

database_request.onupgradeneeded = (_event) => {
    const db = database_request.result;

    retiredKeys.forEach((key) => {
        if (db.objectStoreNames.contains(key)) {
            db.deleteObjectStore(key);
        }
    });

    if (!db.objectStoreNames.contains(DB_STORE_KEYS.dataPackageCache)) {
        const store = db.createObjectStore(DB_STORE_KEYS.dataPackageCache, {
            keyPath: ["game", "checksum"],
        });
        store.createIndex("game-checksum", ["game", "checksum"], {
            unique: true,
        });
    }

    // if (!db.objectStoreNames.contains(DB_STORE_KEYS.groupCache)) {
    //     const store = db.createObjectStore(DB_STORE_KEYS.groupCache, {
    //         keyPath: ["multi_save_id", "slot_number"],
    //     });
    //     store.createIndex("multi-slot", ["multi_save_id", "slot_number"], {
    //         unique: true,
    //     });
    // }

    if (!db.objectStoreNames.contains(DB_STORE_KEYS.customTrackers)) {
        const store = db.createObjectStore(DB_STORE_KEYS.customTrackers, {
            keyPath: ["uuid", "version", "type"],
        });
        store.createIndex("uuid", "uuid", { unique: false });
    }

    if (!db.objectStoreNames.contains(DB_STORE_KEYS.customTrackersDirectory)) {
        const store = db.createObjectStore(
            DB_STORE_KEYS.customTrackersDirectory,
            { keyPath: ["uuid", "version", "type"] }
        );
        store.createIndex("uuid", "uuid", { unique: false });
    }

    if (!db.objectStoreNames.contains(DB_STORE_KEYS.tags)) {
        const store = db.createObjectStore(DB_STORE_KEYS.tags, {
            keyPath: ["multi_save_id", "slot_number"],
        });
        store.createIndex("multi-slot", ["multi_save_id", "slot_number"], {
            unique: true,
        });
    }
};

/**
 * Gets an item from the database
 * @param storeName The name of the object store to get
 * @param key They key of the item to search in the store
 * @returns The requested item if it exists, else null
 */
const getItem = (
    storeName: string,
    key: (string | number) | (string | number)[]
): Promise<unknown> => {
    return new Promise((resolve, _reject) => {
        let hasFailed = false;
        const attemptLoad = () => {
            try {
                const db = database_request.result;
                const transaction = db.transaction([storeName], "readonly");
                const objectStore = transaction.objectStore(storeName);
                const request = objectStore.get(key);
                request.onerror = () => {
                    resolve(null);
                };
                request.onsuccess = () => {
                    resolve(request.result ?? null);
                };
            } catch {
                if (hasFailed) {
                    resolve(null);
                } else {
                    hasFailed = true;
                    setTimeout(attemptLoad, 500);
                }
            }
        };
        if (key) {
            if (database_open) {
                attemptLoad();
            } else {
                queuedEvents.push(attemptLoad);
            }
        } else {
            resolve(null);
        }
    });
};

/**
 * Stores an item
 * @param storeName The object store to store the item in
 * @param item The item to store
 * @returns True if it was successfully stored
 */
const storeItem = (storeName: string, item: unknown): Promise<boolean> => {
    return new Promise((resolve, _reject) => {
        let hasFailed = false;
        const attemptSave = () => {
            try {
                const db = database_request.result;
                const transaction = db.transaction([storeName], "readwrite");
                const objectStore = transaction.objectStore(storeName);
                const request = objectStore.put(item);
                request.onerror = () => {
                    resolve(false);
                };
                request.onsuccess = () => {
                    resolve(true);
                };
            } catch {
                if (hasFailed) {
                    resolve(false);
                } else {
                    hasFailed = true;
                    setTimeout(attemptSave, 500);
                }
            }
        };
        if (database_open) {
            attemptSave();
        } else {
            queuedEvents.push(attemptSave);
        }
    });
};

/**
 * Removes an item from the data store
 * @param storeName The name of the object store to delete from
 * @param key The key of the item to delete
 * @returns True if item was deleted (without respect to if the item existed or not)
 */
const deleteItem = (
    storeName: string,
    key: (string | number) | (string | number)[]
): Promise<boolean> => {
    return new Promise((resolve, _reject) => {
        let hasFailed = false;
        const attemptDelete = () => {
            try {
                const db = database_request.result;
                const transaction = db.transaction([storeName], "readwrite");
                const objectStore = transaction.objectStore(storeName);
                const request = objectStore.delete(key);
                request.onerror = () => {
                    resolve(false);
                };
                request.onsuccess = () => {
                    resolve(true);
                };
            } catch {
                if (hasFailed) {
                    resolve(false);
                } else {
                    hasFailed = true;
                    setTimeout(attemptDelete, 500);
                }
            }
        };
        if (database_open) {
            attemptDelete();
        } else {
            queuedEvents.push(attemptDelete);
        }
    });
};

const getAllItems = (storeName: string): Promise<unknown> => {
    return new Promise((resolve, _reject) => {
        let hasFailed = false;
        const attemptLoad = () => {
            try {
                const db = database_request.result;
                const transaction = db.transaction([storeName], "readonly");
                const objectStore = transaction.objectStore(storeName);
                const request = objectStore.getAll();
                request.onerror = () => {
                    resolve(null);
                };
                request.onsuccess = () => {
                    resolve(request.result ?? null);
                };
            } catch {
                if (hasFailed) {
                    resolve(null);
                } else {
                    hasFailed = true;
                    setTimeout(attemptLoad, 500);
                }
            }
        };

        if (database_open) {
            attemptLoad();
        } else {
            queuedEvents.push(attemptLoad);
        }
    });
};

const SaveData = {
    getItem,
    storeItem,
    deleteItem,
    getAllItems,
};

export { SaveData, DB_STORE_KEYS };
