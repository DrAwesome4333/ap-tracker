// import { GamePackageWrapper } from "../gamepackage/GamePackageWrapper";
// import { APIGamePackage, APIRoomStatus, APIStaticTracker, APITracker, RoomInfo } from "./types";
import { APIRoomStatus, APIStaticTracker, APITracker, RoomInfo } from "./types";

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

    // static getGamePackage = async (checksum: string, origin = "https://archipelago.gg"): Promise<APIGamePackage> => {
    //     return fetchAsJson(`${origin}/api/datapackage/${checksum}`);
    // }

    // getGamePackage = async (checksum: string, game: string): Promise<GamePackageWrapper> => {

    // };

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
}

export { WebHostAPIHandler };
