import EmptyGamePackageWrapper from "../gamepackage/EmptyGamePackageWrapper";
import { GamePackageWrapper } from "../gamepackage/GamePackageWrapper";
import DataPackageHelper from "../MultiInfo/DatapackageHelper";
import { MultiWorldContextData } from "../MultiInfo/MultiWorldContextData";
import {
    APIGamePackage,
    APIOffsets_Hint,
    APIOffsets_Item,
    APIOffsets_Player,
    APIRoomStatus,
    APIStaticTracker,
    APITracker,
    RoomInfo,
} from "./types";

const fetchAsJson = async (path: string) => {
    return fetch(path)
        .then((resp) => resp.text())
        .then((text) => JSON.parse(text));
};

class WebHostAPIHandler {
    #roomInfo: RoomInfo = null;
    constructor(roomInfo: RoomInfo) {
        this.#roomInfo = { ...roomInfo };
    }

    // todo add minute long caching
    getRoomStatus = async (_forceRefresh?: boolean): Promise<APIRoomStatus> => {
        return fetchAsJson(
            `${this.#roomInfo.origin}/api/room_status/${this.#roomInfo.room_suuid}`
        );
    };

    // todo add life long caching
    getStaticTracker = async (
        _skipCache?: boolean
    ): Promise<APIStaticTracker> => {
        return fetchAsJson(
            `${this.#roomInfo.origin}/api/static_tracker/${this.#roomInfo.tracker_suuid}`
        );
    };

    // todo add minute long caching
    getTracker = async (_skipCache?: boolean): Promise<APITracker> => {
        return fetchAsJson(
            `${this.#roomInfo.origin}/api/tracker/${this.#roomInfo.tracker_suuid}`
        );
    };

    get roomInfo() {
        return { ...this.#roomInfo };
    }

    get roomLink() {
        return `${this.#roomInfo.origin}/room/${this.#roomInfo.room_suuid}`;
    }

    static getGamePackage = async (
        checksum: string,
        origin = "https://archipelago.gg"
    ): Promise<APIGamePackage> => {
        return fetchAsJson(`${origin}/api/datapackage/${checksum}`);
    };

    getGamePackage = async (
        checksum: string,
        game: string
    ): Promise<GamePackageWrapper> => {
        return fetchAsJson(
            `${this.#roomInfo.origin}/api/datapackage/${checksum}`
        ).then((gamePackage: APIGamePackage) => {
            if (!gamePackage) {
                return null;
            }
            return new GamePackageWrapper(
                {
                    checksum: gamePackage.checksum,
                    item_name_to_id: gamePackage.item_name_to_id,
                    location_name_to_id: gamePackage.item_name_to_id,
                    location_groups: gamePackage.location_name_groups,
                    item_groups: gamePackage.item_name_groups,
                },
                game
            );
        });
    };

    static async parseRoomLink(roomLink: string): Promise<RoomInfo> {
        const parsedUrl = URL.parse(roomLink);
        if (parsedUrl === null) {
            throw new Error("Provided room link was not a valid URL.", {
                cause: "validation",
            });
        }
        const urlPathParts = parsedUrl.pathname.split("/");
        if (urlPathParts.length < 3 || urlPathParts[1] !== "room") {
            throw new Error(
                `Provided room link did not match the expected format. Should look similar to  "https://archipelago.gg/room/<room id>"`,
                { cause: "validation" }
            );
        }
        const roomId = urlPathParts[2];
        const roomAPIUrl = `${parsedUrl.origin}/api/room_status/${roomId}`;

        return fetchAsJson(roomAPIUrl).then((data: APIRoomStatus) => {
            if (!data.tracker) {
                throw new Error(
                    `Did not receive expected response, double check URL.`,
                    { cause: "verification" }
                );
            }
            return {
                room_suuid: roomId,
                tracker_suuid: data.tracker,
                origin: parsedUrl.origin,
            };
        });
    }

    static async buildMultiWorldContext(
        roomStatus: APIRoomStatus,
        staticTracker: APIStaticTracker,
        origin = "https://archipelago.gg"
    ): Promise<MultiWorldContextData> {
        const context: MultiWorldContextData = {
            groups: {},
            players: {
                0: {
                    name: "Server",
                    game: "Archipelago",
                    slot: 0,
                    groups: new Set(),
                },
            },
            gamePackages: {},
        };

        roomStatus.players.forEach((player, index) => {
            const slotNumber = index + 1;
            context.players[slotNumber] = {
                slot: slotNumber,
                name: player[APIOffsets_Player.slotName],
                game: player[APIOffsets_Player.gameName],
                groups: staticTracker.groups.reduce(
                    (result, group) =>
                        group.members.includes(slotNumber)
                            ? result.add(group.slot)
                            : result,
                    new Set() as Set<number>
                ),
            };
        });

        staticTracker.groups.forEach((group) => {
            context.groups[group.slot] = {
                game: context.players[group.members[0] ?? 0].game,
                name: group.name,
                slot: group.slot,
                players: new Set(group.members),
            };
        });

        const dataPackagePromises = Object.entries(
            staticTracker.datapackage
        ).map(async ([game, { checksum }]) => {
            const localPackage = await DataPackageHelper.getCachedPackage(
                game,
                checksum
            );
            if (localPackage) {
                return [game, new GamePackageWrapper(localPackage, game)] as [
                    string,
                    GamePackageWrapper,
                ];
            }
            const remotePackage = await WebHostAPIHandler.getGamePackage(
                checksum,
                origin
            );
            if (remotePackage) {
                DataPackageHelper.cacheGamePackage({
                    game,
                    checksum,
                    last_used: Date.now(),
                    location_groups: remotePackage.item_name_groups,
                    item_groups: remotePackage.location_name_groups,
                    location_name_to_id: remotePackage.location_name_to_id,
                    item_name_to_id: remotePackage.item_name_to_id,
                });
                return [
                    game,
                    new GamePackageWrapper(
                        {
                            location_groups: remotePackage.item_name_groups,
                            item_groups: remotePackage.location_name_groups,
                            location_name_to_id:
                                remotePackage.location_name_to_id,
                            item_name_to_id: remotePackage.item_name_to_id,
                            checksum,
                        },
                        game
                    ),
                ] as [string, GamePackageWrapper];
            }
            return [game, new EmptyGamePackageWrapper()] as [
                string,
                GamePackageWrapper,
            ];
        });

        const dataPackageResults = await Promise.all(dataPackagePromises);
        dataPackageResults.forEach(([game, gamePackage]) => {
            context.gamePackages[game] = gamePackage;
        });

        return context;
    }
}

export { WebHostAPIHandler };
