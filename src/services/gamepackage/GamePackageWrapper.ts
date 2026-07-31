type GamePackage = {
    /** Mapping of all item names to their respective id. */
    readonly item_name_to_id: Record<string, number>;
    /** Mapping of all location names to their respective id. */
    readonly location_name_to_id: Record<string, number>;
    /** SHA1 checksum of this game's data. */
    readonly checksum: string;
    /** Groupings of locations */
    readonly location_groups: Record<string, string[]>;
    /** Groupings of items */
    readonly item_groups: Record<string, string[]>;
};

class GamePackageWrapper {
    #package: GamePackage;
    #item_id_to_name: Record<number, string> = {};
    #location_id_to_name: Record<number, string> = {};
    readonly game: string;
    constructor(gamePackage: GamePackage, game: string) {
        this.#package = gamePackage;
        Object.entries(this.#package.item_name_to_id).forEach(([name, id]) => {
            this.#item_id_to_name[id] = name;
        });
        Object.entries(this.#package.location_name_to_id).forEach(
            ([name, id]) => {
                this.#location_id_to_name[id] = name;
            }
        );
        Object.freeze(this.#item_id_to_name);
        Object.freeze(this.#location_id_to_name);
        this.game = game;
    }

    getItemName = (itemId: number) => {
        return this.#item_id_to_name[itemId] ?? `Unknown item ${itemId}`;
    };

    getLocationName = (locationId: number) => {
        return (
            this.#location_id_to_name[locationId] ??
            `Unknown location ${locationId}`
        );
    };

    getItemId = (itemName: string) => {
        return this.#package.item_name_to_id[itemName];
    };

    getLocationId = (locationName: string) => {
        return this.#package.location_name_to_id[locationName];
    };

    getAllLocationNames = () => {
        return Object.keys(this.#package.location_name_to_id);
    };

    getAllItemNames = () => {
        return Object.keys(this.#package.item_name_to_id);
    };

    getAllLocationIds = () => {
        return Object.keys(this.#location_id_to_name).map((x) => parseInt(x));
    };

    getAllItemIds = () => {
        return Object.keys(this.#item_id_to_name).map((x) => parseInt(x));
    };

    getItemGroups = () => {
        return this.#package.item_groups;
    };
    getLocationGroups = () => {
        return this.#package.location_groups;
    };

    exportPackage = (): GamePackage => {
        return {
            ...this.#package,
        };
    };
}

export { GamePackageWrapper };
