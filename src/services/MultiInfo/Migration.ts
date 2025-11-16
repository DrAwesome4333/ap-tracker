// Delete after Feb 2025
import { Client } from "archipelago.js";
import { SavedConnection } from "../savedConnections/savedConnectionManager";
import MultiWorldContext from "./MultiWorldContext";
import { LocationTagger } from "../tags/LocationTagger";

/** Migrates old connection code to new format */
const migrateConnection = (
    oldConnection: SavedConnection,
    slot_number: number
) => {
    const seed_name = oldConnection.seed;
    const last_used_timestamp = oldConnection.lastUsedTime;
    const game = oldConnection.game;
    const connection_details = {
        host: oldConnection.host,
        port: oldConnection.port,
        password: oldConnection.password,
    };
    const title = oldConnection.name;
    const slot_name = oldConnection.slot;

    let existingMulti = MultiWorldContext.findMatchingMultiWorld(seed_name);
    if (!existingMulti) {
        existingMulti = MultiWorldContext.createMultiWorldDetails({
            seed_name,
            connection_details,
        });
    }

    const slotDetails = MultiWorldContext.addSlot(existingMulti.multi_save_id, {
        game,
        slot_name,
        slot_number,
    });

    slotDetails.title = title;
    slotDetails.last_used_timestamp = last_used_timestamp;

    MultiWorldContext.updateSlot(slotDetails.multi_save_id, slot_number, {
        ...slotDetails,
    });
    return { multi_world: existingMulti, slot: slotDetails };
};

const migrateTags = (
    apClient: Client,
    tags: {
        [tag_name: string]: { checkName: string; typeId: "star" | "ignore" };
    },
    locationTagger: LocationTagger
) => {
    Object.values(tags).forEach((tag) => {
        if (["star", "ignore"].includes(tag.typeId)) {
            const locationId = apClient.package.findPackage(apClient.game)
                .locationTable[tag.checkName];
            locationTagger.addTag(tag.typeId, locationId);
        }
    });
};

export { migrateConnection, migrateTags };
