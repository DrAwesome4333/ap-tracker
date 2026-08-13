type APIGamePackage = {
    checksum: string;
    item_name_groups: Record<string, string[]>;
    item_name_to_id: Record<string, number>;
    location_name_groups: Record<string, string[]>;
    location_name_to_id: Record<string, number>;
};

type APISlotDownload = {
    download: string;
    slot: number;
};
type SlotName = string;
type GameName = string;

enum APIOffsets_Player {
    slotName = 0,
    gameName = 1,
}

type APIRoomStatus = {
    downloads: APISlotDownload[];
    last_activity: string;
    last_port: number;
    players: [SlotName, GameName][];
    timeout: number;
    tracker: string;
};

type ItemId = number;
type LocationId = number;
type SlotNumber = number;
type ItemFlags = number;
type APIItem = [ItemId, LocationId, SlotNumber, ItemFlags];
enum APIOffsets_Item {
    itemId = 0,
    locationId = 1,
    slotNumber = 2,
    itemFlags = 3,
}

type ReceivingPlayer = number;
type FindingPlayer = number;
type HintFound = number;
type Entrance = string;
type HintStatus = number; // TODO replace with enum
enum APIOffsets_Hint {
    receivingPlayer = 0,
    findingPlayer = 1,
    locationId = 2,
    itemId = 3,
    hintFound = 4,
    entrance = 5,
    itemFlags = 6,
    status = 7,
}
type APIHint = [
    ReceivingPlayer,
    FindingPlayer,
    LocationId,
    ItemId,
    HintFound,
    Entrance,
    ItemFlags,
    HintStatus,
];
type ClientStatus = number; // TODO replace with enum

type APITracker = {
    aliases: {
        team: number;
        player: number;
        alias: string;
    }[];
    player_items_received: {
        team: number;
        player: number;
        items: APIItem[];
    }[];
    player_checks_done: {
        team: number;
        player: number;
        locations: LocationId[];
    }[];
    total_checks_done: {
        team: number;
        checks_done: number;
    }[];
    hints: {
        team: number;
        player: number;
        hints: APIHint[];
    }[];
    activity_timers: {
        team: number;
        player: number;
        time: string;
    }[];
    connection_timers: {
        team: number;
        player: number;
        time: string;
    }[];
    player_status: {
        team: number;
        player: number;
        status: ClientStatus;
    }[];
};

type APIStaticTracker = {
    groups: {
        slot: number;
        name: string;
        members: number[];
    }[];
    datapackage: Record<string, { checksum: string }>;
    player_locations_total: {
        player: number;
        team: number;
        total_locations: number;
    }[];
    player_game: {
        team: number;
        player: number;
        game: string;
    }[];
};

type RoomInfo = {
    origin: string;
    room_suuid: string;
    tracker_suuid: string;
};

export type {
    APIGamePackage,
    APISlotDownload,
    APIRoomStatus,
    APIItem,
    APIHint,
    APITracker,
    APIStaticTracker,
    RoomInfo,
};

export { APIOffsets_Item, APIOffsets_Hint, APIOffsets_Player };
