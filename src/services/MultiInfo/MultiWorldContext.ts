import { randomShortId } from "../../utility/uuid";
import { JSONValue, LocalStorageDataStore } from "../dataStores";

interface SavedMultiWorldDetails {
    /** Unique key to mark save data */
    multi_save_id: string;
    /** Unique identifier for the seed, not necessarily unique per save  */
    seed_name: string;
    /** A title assigned by the user */
    title: string;
    /** The data version */
    version: 1;
    /** Connection details shared by all slots in multi-world */
    connection_details: {
        host: string;
        port: string;
        password: string;
    };
    /** Details related to getting room information */
    room_details?: {
        host: string;
        room_suuid: string;
        tracker_suuid: string;
    };
    /** Maps games to their respective checksums in the multi-world */
    data_package_details?: { [game_name: string]: string };
    options?: {
        auto_update_connection_details?: boolean;
    };
}

interface SavedMultiWorldUpdate {
    /** A title assigned by the user */
    title?: string;
    /** The data version */
    version?: 1;
    /** Connection details shared by all slots in multi-world */
    connection_details?: {
        host: string;
        port: string;
        password: string;
    };
    /** Details related to getting room information */
    room_details?: {
        host: string;
        room_suuid: string;
        tracker_suuid: string;
    };
    /** Maps games to their respective checksums in the multi-world */
    data_package_details?: { [game_name: string]: string };
    options?: {
        auto_update_connection_details?: boolean;
    };
}

interface SavedSlotDetails {
    /** Id of associated multi-world save */
    multi_save_id: string;
    /** Slot number for the seed */
    slot_number: number;
    /** The slot name used to connect */
    slot_name: string;
    slot_alias?: string;
    game: string;
    title: string;
    last_used_timestamp: number;
    last_item_index: number;
    color?: string;
    version: 1;
}

type MultiWorldWithSlotDetails = {
    slots: SavedSlotDetails[];
    last_used_timestamp: number;
} & SavedMultiWorldDetails;

const multiLocalStorageKey = "ap_checklist_multi_details";
const multiDataStore = new LocalStorageDataStore(multiLocalStorageKey);
const slotLocalStorageKey = "ap_checklist_slot_details";
const slotDataStore = new LocalStorageDataStore(slotLocalStorageKey);
const computeSlotKey = (multi_save_id: string, slot_number: number) =>
    `${multi_save_id}_${slot_number}`;

class MultiWorldContext {
    static loadedMultiWorld: MultiWorldWithSlotDetails;
    static loadedSlot: SavedSlotDetails;
    static #cachedAllWorlds: MultiWorldWithSlotDetails[];
    static #multiDetailsPrev: { [save_id: string]: SavedMultiWorldDetails };
    static #slotDetailsPrev: { [save_id: string]: SavedSlotDetails };
    static #dataUpdateListeners: Set<() => void> = new Set();
    static #updateConfigured = false;
    static #deleteListeners: Set<
        (multi_save_id: string, slot_number?: number) => void
    > = new Set();

    static configureUpdate = () => {
        if (MultiWorldContext.#updateConfigured) {
            return;
        }
        const callUpdates = () => {
            MultiWorldContext.#dataUpdateListeners.forEach((callback) =>
                callback()
            );
        };
        multiDataStore.getUpdateSubscriber()(callUpdates);
        slotDataStore.getUpdateSubscriber()(callUpdates);
        MultiWorldContext.#updateConfigured = true;
    };

    static addUpdateCallback = (callback: () => void) => {
        MultiWorldContext.#dataUpdateListeners.add(callback);
        return () => MultiWorldContext.#dataUpdateListeners.delete(callback);
    };

    static addDeleteCallback = (
        callback: (multi_save_id: string, slot_number?: number) => void
    ) => {
        MultiWorldContext.#deleteListeners.add(callback);
        return () => MultiWorldContext.#deleteListeners.delete(callback);
    };

    static getAllMultiWorldsWithSlots = (): MultiWorldWithSlotDetails[] => {
        const saveMultiWorldData = multiDataStore.read() as unknown as {
            [save_id: string]: SavedMultiWorldDetails;
        };
        const slotData = slotDataStore.read() as unknown as {
            [save_id: string]: SavedSlotDetails;
        };
        if (
            this.#multiDetailsPrev === saveMultiWorldData &&
            this.#slotDetailsPrev === slotData &&
            this.#cachedAllWorlds
        ) {
            return this.#cachedAllWorlds;
        }
        this.#multiDetailsPrev = saveMultiWorldData;
        this.#slotDetailsPrev = slotData;

        const multiWorlds: { [save_id: string]: MultiWorldWithSlotDetails } =
            {};
        Object.values(saveMultiWorldData).forEach((multi) => {
            multiWorlds[multi.multi_save_id] = {
                ...multi,
                slots: [],
                last_used_timestamp: 0,
            };
        });
        Object.values(slotData).forEach((slot) => {
            const multi = multiWorlds[slot.multi_save_id];
            multi.slots.push(slot);
            multi.last_used_timestamp = Math.max(
                multi.last_used_timestamp,
                slot.last_used_timestamp
            );
            Object.freeze(slot);
        });
        const result: MultiWorldWithSlotDetails[] = Object.values(multiWorlds);
        result.sort((a, b) => b.last_used_timestamp - a.last_used_timestamp);
        this.#cachedAllWorlds = result;
        return result;
    };

    static setLoadedSlot = (multi_world_id: string, slot_number: number) => {
        const saveMultiWorldData = multiDataStore.read(
            multi_world_id
        ) as unknown as SavedMultiWorldDetails;
        const slot = slotDataStore.read(
            computeSlotKey(multi_world_id, slot_number)
        ) as unknown as SavedSlotDetails;
        const multiWithSlots: MultiWorldWithSlotDetails = {
            ...saveMultiWorldData,
            slots: MultiWorldContext.findAllSlotsForMultiWorld(multi_world_id),
            last_used_timestamp: 0,
        };
        multiWithSlots.last_used_timestamp = Math.max(
            ...multiWithSlots.slots.map((slot) => slot.last_used_timestamp)
        );
        MultiWorldContext.loadedMultiWorld = multiWithSlots;
        MultiWorldContext.loadedSlot = slot;
    };

    static findMatchingMultiWorld = (seed_name: string) => {
        const saveMultiWorldData = multiDataStore.read() as unknown as {
            [save_id: string]: SavedMultiWorldDetails;
        };
        const matchingMultiWords = [
            ...Object.values(saveMultiWorldData),
        ].filter((multi) => multi.seed_name === seed_name);
        if (matchingMultiWords?.length > 0) {
            return matchingMultiWords[0];
        }
        return null;
    };

    static findAllSlotsForMultiWorld = (multi_world_id: string) => {
        const slotData = slotDataStore.read() as unknown as {
            [save_id: string]: SavedSlotDetails;
        };
        const slots = [...Object.values(slotData)].filter(
            (slot) => slot.multi_save_id === multi_world_id
        );
        return slots;
    };

    static getMultiWorld = (multi_world_id: string) => {
        const multi = multiDataStore.read(
            multi_world_id
        ) as unknown as SavedMultiWorldDetails;
        return multi;
    };

    static getSlot = (multi_world_id: string, slot_number: number) => {
        const slot = slotDataStore.read(
            computeSlotKey(multi_world_id, slot_number)
        ) as unknown as SavedSlotDetails;
        return slot ?? null;
    };

    static createMultiWorldDetails = (details: {
        seed_name: string;
        data_package_details?: { [game_name: string]: string };
        connection_details: {
            host: string;
            port: string;
            password: string;
        };
    }) => {
        const multi_save_id = randomShortId();
        const multi_details: SavedMultiWorldDetails = {
            multi_save_id,
            seed_name: details.seed_name,
            data_package_details: {
                ...(details.data_package_details ?? {}),
            },
            connection_details: {
                ...details.connection_details,
            },
            title: `Multi-world: ${details.seed_name}`,
            version: 1,
        };
        if (!details.data_package_details) {
            delete multi_details["data_package_details"];
        }
        multiDataStore.write(
            multi_details as unknown as JSONValue,
            multi_save_id
        );
        return multi_details;
    };

    static updateMultiWorld = (
        multi_save_id: string,
        update: SavedMultiWorldUpdate
    ) => {
        const existingWorld = multiDataStore.read(
            multi_save_id
        ) as unknown as SavedMultiWorldDetails;
        const newCopy: SavedMultiWorldDetails = {
            ...existingWorld,
            ...update,
        };
        multiDataStore.write(newCopy as unknown as JSONValue, multi_save_id);
        if (
            MultiWorldContext.loadedMultiWorld?.multi_save_id === multi_save_id
        ) {
            this.setLoadedSlot(
                multi_save_id,
                MultiWorldContext.loadedSlot.slot_number
            );
        }
        return newCopy;
    };

    static addSlot = (
        multi_save_id: string,
        slot: {
            game: string;
            slot_number: number;
            slot_name: string;
            slot_alias?: string;
        }
    ) => {
        const multi = MultiWorldContext.getMultiWorld(multi_save_id);
        if (!multi) {
            throw "Cannot save slot on non-existing multi world";
        }
        const slotDetails: SavedSlotDetails = {
            multi_save_id,
            ...slot,
            last_used_timestamp: Date.now(),
            title: slot.slot_alias ?? slot.slot_name,
            slot_alias: slot.slot_alias,
            last_item_index: 0,
            version: 1,
        };

        slotDataStore.write(
            slotDetails as unknown as JSONValue,
            computeSlotKey(slotDetails.multi_save_id, slotDetails.slot_number)
        );
        return slotDetails;
    };

    static deleteSlot = (slot: SavedSlotDetails) => {
        slotDataStore.delete(
            computeSlotKey(slot.multi_save_id, slot.slot_number)
        );
        const slotInWorldCount = MultiWorldContext.findAllSlotsForMultiWorld(
            slot.multi_save_id
        ).length;
        MultiWorldContext.#deleteListeners.forEach((listener) =>
            listener(slot.multi_save_id, slot.slot_number)
        );
        if (slotInWorldCount === 0) {
            multiDataStore.delete(slot.multi_save_id);
            MultiWorldContext.#deleteListeners.forEach((listener) =>
                listener(slot.multi_save_id)
            );
        }
    };

    static updateSlot = (
        multi_save_id: string,
        slot_number: number,
        update: {
            slot_alias?: string;
            title?: string;
            last_item_index?: number;
            last_used_timestamp?: number;
            color?: string;
        }
    ) => {
        const oldSlot = MultiWorldContext.getSlot(multi_save_id, slot_number);
        if (!oldSlot) {
            return false;
        }
        const newSlot: SavedSlotDetails = {
            ...oldSlot,
            ...update,
            last_used_timestamp: Date.now(),
        };
        slotDataStore.write(
            newSlot as unknown as JSONValue,
            computeSlotKey(newSlot.multi_save_id, newSlot.slot_number)
        );
        if (
            MultiWorldContext.loadedMultiWorld?.multi_save_id === multi_save_id
        ) {
            this.setLoadedSlot(
                multi_save_id,
                MultiWorldContext.loadedSlot.slot_number
            );
        }
        return true;
    };
}

MultiWorldContext.configureUpdate();

export default MultiWorldContext;
export type {
    MultiWorldWithSlotDetails,
    SavedMultiWorldDetails,
    SavedSlotDetails,
};
