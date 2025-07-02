import { InventoryManager } from "../inventory/inventoryManager";
import { LocationManager } from "../locations/locationManager";
import { DB_STORE_KEYS, SaveData } from "../saveData";
import CustomLocationTracker from "./locationTrackers/CustomLocationTracker";
import { convertLocationTrackerV1toV2 } from "./locationTrackers/upgradePathV1V2";
import { ResourceType } from "./resourceEnums";

const customTrackerRepositoryUUID = "c76c2420-d100-4093-8734-c52ddedd8917";
type CustomTrackerDirectory = { [uuid: string]: ResourceManifest[] };

class CustomTrackerRepository implements ResourceRepository {
    readonly uuid = customTrackerRepositoryUUID;
    resources: ResourceManifest[] = [];
    #directory: CustomTrackerDirectory = null;
    #resourceListeners: Set<() => void> = new Set();
    #locationManager: LocationManager;
    #directoryQueueCallbacks: (() => void)[] = [];
    // #inventoryManager: InventoryManager;

    constructor(
        locationManager: LocationManager,
        _inventoryManager: InventoryManager
    ) {
        this.#locationManager = locationManager;
        // this.#inventoryManager = inventoryManager;
        SaveData.getAllItems(DB_STORE_KEYS.customTrackersDirectory)
            .then((manifests: ResourceManifest[]) => {
                if (manifests) {
                    const newDirectory: CustomTrackerDirectory = {};
                    manifests.forEach((manifest) => {
                        const items: ResourceManifest[] =
                            newDirectory[manifest.uuid] ?? [];
                        items.push(manifest);
                        newDirectory[manifest.uuid] = items;
                    });
                    this.#updateDirectory(newDirectory);
                }
            })
            .then(() => {
                this.#directoryQueueCallbacks.forEach((callback) => callback());
            });
    }

    #updateDirectory = (newDirectory: CustomTrackerDirectory) => {
        this.resources = Object.entries(newDirectory)
            .map(([_uuid, manifest]) => manifest)
            .flat();
        this.#directory = newDirectory;
        this.#callListeners();
    };

    #callListeners = () => {
        this.#resourceListeners.forEach((listener) => listener());
    };

    getUpdateSubscriber = (_types?: ResourceType[]) => {
        return (listener: () => void) => {
            this.#resourceListeners.add(listener);
            return () => {
                this.#resourceListeners.delete(listener);
            };
        };
    };

    loadResource: (
        uuid: string,
        version: string,
        type: ResourceType
    ) => Promise<Resource> = async (uuid, version, type) => {
        if (!this.#directory[uuid]) {
            throw new Error(`Failed to locate resource ${uuid}`);
        }
        // TODO support custom item trackers
        const resource = (await SaveData.getItem(DB_STORE_KEYS.customTrackers, [
            uuid,
            version,
            type,
        ])) as CustomLocationTrackerDef_V2;

        return new CustomLocationTracker(
            this.#locationManager,
            customTrackerRepositoryUUID,
            resource
        );
    };

    initialize: () => Promise<boolean> = async () => {
        return true;
    };

    addTracker = (
        data: CustomLocationTrackerDef_V2 | CustomLocationTrackerDef_V1
    ) => {
        if (!data) {
            console.warn("Could not add empty tracker!");
            return;
        }
        if ("customTrackerVersion" in data) {
            data = convertLocationTrackerV1toV2(data);
        }

        const addTracker = () => {
            const trackerVersions = this.#directory[data.manifest.uuid] ?? [];
            const updatedDirectory = {
                ...this.#directory,
                [data.manifest.uuid]: trackerVersions,
            };
            const trackerIndex =
                trackerVersions
                    .map((manifest, index) => ({ manifest, index }))
                    .filter(
                        ({ manifest }) =>
                            manifest.version === data.manifest.version
                    )[0]?.index ?? -1;
            if (trackerIndex === -1) {
                trackerVersions.push(data.manifest);
            } else {
                trackerVersions[trackerIndex] = data.manifest;
            }
            SaveData.storeItem(
                DB_STORE_KEYS.customTrackersDirectory,
                data.manifest
            );
            SaveData.storeItem(DB_STORE_KEYS.customTrackers, {
                uuid: data.manifest.uuid,
                version: data.manifest.version,
                type: data.manifest.type,
                ...data,
            });
            this.#updateDirectory(updatedDirectory);
        };

        if (this.#directory) {
            addTracker();
        } else {
            this.#directoryQueueCallbacks.push(addTracker);
        }
    };
}

export { CustomTrackerRepository, customTrackerRepositoryUUID };
