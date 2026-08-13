import { GamePackageWrapper } from "../../../gamepackage/GamePackageWrapper";
import {
    LocationSource,
    LocationStatus,
    LocationUpdateCallback,
} from "../../../locations/locationSource";

class TemplateLocationSource implements LocationSource {
    #locations: LocationStatus[] = [];
    constructor(gamePackage: GamePackageWrapper) {
        this.#locations = gamePackage.getAllLocationIds().map((id) => ({
            locationId: id,
            name: gamePackage.getLocationName(id),
            checked: false,
            ignored: false,
        }));
    }

    locationUpdateHook = (callback: LocationUpdateCallback) => {
        callback([...this.#locations]);
        return () => {
            /* Empty cleanup call, nothing to clean up */
        };
    };
}

export default TemplateLocationSource;
