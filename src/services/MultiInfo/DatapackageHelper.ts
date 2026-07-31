// structure: package / game / checksum

import {
    API,
    DataPackageCache,
    GamePackage as AP_GamePackage,
} from "archipelago.js";
import { DB_STORE_KEYS, SaveData } from "../saveData";

interface CachedGamePackage {
    game: string;
    checksum: string;
    last_used: number;
    item_name_to_id: Record<string, number>;
    location_name_to_id: Record<string, number>;
    location_groups: Record<string, string[]>;
    item_groups: Record<string, string[]>;
}

const DataPackageHelper: DataPackageCache & {
    cacheGamePackage: (gamePackage: CachedGamePackage) => Promise<void>;
    cachePackage: (
        dataPackage: API.DataPackage,
        groups: {
            item: Record<string, string[]>;
            location: Record<string, string[]>;
        },
        groupGameName: string
    ) => Promise<void>;
    getCachedPackage: (
        game: string,
        checksum: string
    ) => Promise<CachedGamePackage>;
} = {
    getPackage: async (
        game: string,
        checksum?: string
    ): Promise<AP_GamePackage> => {
        if (!checksum) {
            return null;
        }

        const cache = (await SaveData.getItem(DB_STORE_KEYS.dataPackageCache, [
            game,
            checksum,
        ])) as CachedGamePackage;

        if (!cache) {
            return null;
        }

        const gamePackage: AP_GamePackage = {
            checksum: cache.checksum,
            item_name_to_id: cache.item_name_to_id,
            location_name_to_id: cache.location_name_to_id,
        };
        return gamePackage;
    },
    getCachedPackage: async (game: string, checksum: string) => {
        const cache = (await SaveData.getItem(DB_STORE_KEYS.dataPackageCache, [
            game,
            checksum,
        ])) as CachedGamePackage;
        return cache;
    },
    cacheGamePackage: async (gamePackage: CachedGamePackage) => {
        await SaveData.storeItem(DB_STORE_KEYS.dataPackageCache, gamePackage);
    },
    cachePackage: async (
        dataPackage: API.DataPackage,
        groups: {
            item: Record<string, string[]>;
            location: Record<string, string[]>;
        },
        gameName: string
    ) => {
        const promises = Object.entries(dataPackage.games).map(
            async ([game, data]) => {
                const cache = (await SaveData.getItem(
                    DB_STORE_KEYS.dataPackageCache,
                    [game, data.checksum]
                )) as CachedGamePackage;
                if (cache) {
                    cache.last_used = Date.now();
                    if (
                        (!cache.location_groups || !cache.item_groups) &&
                        gameName === game
                    ) {
                        cache.location_groups = groups.location;
                        cache.item_groups = groups.item;
                    }
                    await SaveData.storeItem(
                        DB_STORE_KEYS.dataPackageCache,
                        cache
                    );
                    return;
                }
                let newCache = {
                    game,
                    ...data,
                    last_used: Date.now(),
                    item_groups: undefined,
                    location_groups: undefined,
                };
                if (game === gameName) {
                    newCache.item_groups = groups.item;
                    newCache.location_groups = groups.location;
                }
                await SaveData.storeItem(
                    DB_STORE_KEYS.dataPackageCache,
                    newCache
                );
            }
        );
        await Promise.all(promises);
    },
};

Object.freeze(DataPackageHelper);

export default DataPackageHelper;
