// syncs checks with location manager

import { Client } from "archipelago.js";
import { LocationManager } from "../locations/locationManager";
import HintManager from "../HintManager";

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
    hintManager: HintManager
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

    hintManager.initializeListeners(client);
};

export { setAPLocations, setupAPCheckSync };
