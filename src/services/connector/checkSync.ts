// syncs checks with location manager

import { Client, Hint, NetworkHint } from "archipelago.js";
import { TagManager } from "../tags/tagManager";
import { LocationManager } from "../locations/locationManager";

const hintToText = (client: Client, hint: Hint) => {
    let ownerString = `${hint.item.receiver.alias}'s`;
    if (hint.item.receiver.slot === client.players.self.slot) {
        ownerString = "Your";
    }
    let finderString = `${hint.item.sender.alias}'s`;
    if (hint.item.sender.slot === client.players.self.slot) {
        finderString = "your";
    }

    const entranceString =
        hint.entrance !== "Vanilla" ? `(${hint.entrance})` : "";
    return `${ownerString} ${hint.item.name} is at ${hint.item.locationName} in ${finderString} world. ${entranceString}`;
};

const addHint = (
    client: Client,
    hint: Hint,
    tagManager: TagManager,
    saveId: string
) => {
    if (hint.item.sender.slot === client.players.self.slot) {
        const tagData = tagManager.createTagData();
        tagData.checkName = hint.item.locationName;
        tagData.typeId = "hint";
        tagData.text = hintToText(client, hint);
        tagData.tagId = `hint-${hint.item.locationName}`;
        tagManager.addTag(tagData, saveId);
    }
};

const setAPLocations = (client: Client, locationManager: LocationManager) => {
    locationManager.deleteAllLocations();
    client.room.allLocations.forEach((locationId) =>
        locationManager.updateLocationStatus(
            client.package.lookupLocationName(client.game, locationId),
            {
                exists: true,
            }
        )
    );
    client.room.checkedLocations.forEach((locationId) =>
        locationManager.updateLocationStatus(
            client.package.lookupLocationName(client.game, locationId),
            {
                checked: true,
            }
        )
    );

    const now = new Date();
    if (now.getMonth() === 3 && now.getDate() < 7) {
        // April fools joke
        client.deathLink.enableDeathLink();
    }
};

const setupAPCheckSync = (
    client: Client,
    locationManager: LocationManager,
    tagManager: TagManager,
    connection: { slotInfo: { connectionId: string } }
) => {
    client.room.on("locationsChecked", (locationIds) => {
        locationManager.pauseUpdateBroadcast();
        locationIds.forEach((id) =>
            locationManager.updateLocationStatus(
                client.package.lookupLocationName(client.game, id),
                {
                    checked: true,
                    id,
                }
            )
        );
        locationManager.resumeUpdateBroadcast();
    });

    client.items
        .on("hintsInitialized", (hints) => {
            hints.forEach((hint) =>
                addHint(
                    client,
                    hint,
                    tagManager,
                    connection.slotInfo.connectionId
                )
            );
            // remove once ap.js hints are fixed
            client.storage.notify(
                [
                    `_read_hints_${client.players.self.team}_${client.players.self.slot}`,
                ],
                (_key, value: NetworkHint[], _old_value?: NetworkHint[]) => {
                    const seenLocations = new Set(
                        _old_value
                            ?.filter(
                                (nHint) =>
                                    nHint.finding_player ===
                                    client.players.self.slot
                            )
                            .map((nHint) => nHint.location)
                    );
                    value.forEach((nHint) => {
                        const hint = new Hint(client, nHint);
                        if (
                            nHint.finding_player === client.players.self.slot &&
                            !seenLocations.has(nHint.location)
                        ) {
                            addHint(
                                client,
                                hint,
                                tagManager,
                                connection.slotInfo.connectionId
                            );
                        }
                    });
                }
            );
        })
        .on("hintReceived", (hint) =>
            addHint(client, hint, tagManager, connection.slotInfo.connectionId)
        );
};

export { setAPLocations, setupAPCheckSync };
