// syncs checks with location manager

import { API, Client, Hint } from "archipelago.js";
import { LocationManager } from "../locations/locationManager";
import HintTagger from "../tags/HintTagger";

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
    const priorityString =
        hint.status === API.HintStatus.unspecified
            ? "[unspecified]"
            : hint.status === API.HintStatus.no_priority
              ? "[no priority]"
              : hint.status === API.HintStatus.avoid
                ? "[avoid]"
                : hint.status === API.HintStatus.priority
                  ? "[priority]"
                  : hint.status === API.HintStatus.found
                    ? "[found]"
                    : "[unknown priority]";
    return `${ownerString} ${hint.item.name} is at ${hint.item.locationName} in ${finderString} world. ${entranceString} ${priorityString}`;
};

const addHint = (client: Client, hint: Hint, hintTagger: HintTagger) => {
    if (hint.item.sender.slot === client.players.self.slot) {
        hintTagger.addHint(
            hint.item.locationId,
            hintToText(client, hint),
            hint.status
        );
    }
};
const archipelagoJS_SourceId = "archipelago.js_source";
const setAPLocations = (client: Client, locationManager: LocationManager) => {
    locationManager.registerSourcePriority(archipelagoJS_SourceId, 1);
    locationManager.deleteAllLocations();
    client.room.allLocations.forEach((locationId) =>
        locationManager.updateLocationStatus(
            archipelagoJS_SourceId,
            client.package.lookupLocationName(client.game, locationId),
            {
                exists: true,
                id: locationId,
            }
        )
    );
    client.room.checkedLocations.forEach((locationId) =>
        locationManager.updateLocationStatus(
            archipelagoJS_SourceId,
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
    hintTagger: HintTagger
) => {
    client.room.on("locationsChecked", (locationIds) => {
        locationManager.pauseUpdateBroadcast();
        locationIds.forEach((id) =>
            locationManager.updateLocationStatus(
                archipelagoJS_SourceId,
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
        .on("hintsInitialized", (hints) =>
            hints.forEach((hint) => addHint(client, hint, hintTagger))
        )
        .on("hintReceived", (hint) => addHint(client, hint, hintTagger))
        .on("hintUpdated", (hint) => addHint(client, hint, hintTagger));
};

export { setAPLocations, setupAPCheckSync };
