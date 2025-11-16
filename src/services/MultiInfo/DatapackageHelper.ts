// structure: package / game / checksum

import { API, DataPackageCache, GamePackage } from "archipelago.js";
import { DB_STORE_KEYS, SaveData } from "../saveData";

interface CachedDataPackage {
    game: string;
    checksum: string;
    last_used: number;
    item_name_to_id: {
        [item_name: string]: number;
    };
    location_name_to_id: {
        [location_name: string]: number;
    };
}

const DataPackageHelper: DataPackageCache & {
    cachePackage: (dataPackage: API.DataPackage) => Promise<void>;
} = {
    getPackage: async (
        game: string,
        checksum?: string
    ): Promise<GamePackage> => {
        if (!checksum) {
            return null;
        }

        const cache = (await SaveData.getItem(DB_STORE_KEYS.dataPackageCache, [
            game,
            checksum,
        ])) as CachedDataPackage;

        if (!cache) {
            return null;
        }

        const gamePackage: GamePackage = {
            checksum: cache.checksum,
            item_name_to_id: cache.item_name_to_id,
            location_name_to_id: cache.location_name_to_id,
        };
        return gamePackage;
    },

    cachePackage: async (dataPackage: API.DataPackage) => {
        Object.entries(dataPackage.games).forEach(async ([game, data]) => {
            const cache = (await SaveData.getItem(
                DB_STORE_KEYS.dataPackageCache,
                [game, data.checksum]
            )) as CachedDataPackage;
            if (cache) {
                cache.last_used = Date.now();
                await SaveData.storeItem(DB_STORE_KEYS.dataPackageCache, cache);
                return;
            }
            await SaveData.storeItem(DB_STORE_KEYS.dataPackageCache, {
                game,
                ...data,
                last_used: Date.now(),
            });
        });
    },
};

Object.freeze(DataPackageHelper);

export default DataPackageHelper;
