import { Client, Hint as APJS_Hint, API } from "archipelago.js";
import HintTagger from "./tags/HintTagger";
import {
    MultiWorldContextData,
    MultiWorldContextHelper,
    MultiWorldPlayer,
} from "./MultiInfo/MultiWorldContextData";
import { APIHint, APIOffsets_Hint, APITracker } from "./WebHostAPI/types";

const hintToText = (multiWorldContext: MultiWorldContextData, hint: Hint) => {
    let ownerString = `${MultiWorldContextHelper.getSlotName(multiWorldContext, hint.receivingPlayer)}'s`;
    if (hint.receivingPlayer === multiWorldContext.trackedSlot) {
        ownerString = "Your";
    }
    let finderString = `${MultiWorldContextHelper.getSlotName(multiWorldContext, hint.findingPlayer)}`;
    if (hint.findingPlayer === multiWorldContext.trackedSlot) {
        finderString = "your";
    }

    const entranceString =
        hint.entrance !== "Vanilla" ? `(${hint.entrance})` : "";
    const priorityString =
        hint.status === API.HintStatus.unspecified
            ? "Unspecified"
            : hint.status === API.HintStatus.no_priority
              ? "No Priority"
              : hint.status === API.HintStatus.avoid
                ? "Avoid"
                : hint.status === API.HintStatus.priority
                  ? "Priority"
                  : hint.status === API.HintStatus.found
                    ? "Found"
                    : "Unknown Priority";
    const itemName = MultiWorldContextHelper.getItemName(
        multiWorldContext,
        hint.receivingPlayer,
        hint.itemId
    );
    const locationName = MultiWorldContextHelper.getLocationName(
        multiWorldContext,
        hint.findingPlayer,
        hint.locationId
    );

    return `${ownerString} ${itemName} is at ${locationName} in ${finderString} world. ${entranceString} ${priorityString}`;
};

const computeHintId = (hint: Hint) =>
    `${hint.team}-${hint.receivingPlayer}-${hint.findingPlayer}-${hint.locationId}`;

type Hint = {
    team: number;
    receivingPlayer: number;
    findingPlayer: number;
    locationId: number;
    itemId: number;
    found: boolean;
    status: API.HintStatus;
    itemFlags: number;
    entrance: string;
};

const convertAPJSHint = (ap_hint: APJS_Hint): Hint => {
    return {
        team: ap_hint.item.receiver.team,
        receivingPlayer: ap_hint.item.receiver.slot,
        findingPlayer: ap_hint.item.sender.slot,
        locationId: ap_hint.item.locationId,
        itemId: ap_hint.item.id,
        found: ap_hint.found,
        status: ap_hint.status,
        itemFlags: ap_hint.item.flags,
        entrance: ap_hint.entrance,
    };
};

const convertAPIHint = (api_hint: APIHint, team: number): Hint => {
    return {
        team,
        receivingPlayer: api_hint[APIOffsets_Hint.receivingPlayer],
        findingPlayer: api_hint[APIOffsets_Hint.findingPlayer],
        locationId: api_hint[APIOffsets_Hint.locationId],
        itemId: api_hint[APIOffsets_Hint.itemId],
        found: !!api_hint[APIOffsets_Hint.hintFound],
        status: api_hint[APIOffsets_Hint.status],
        itemFlags: api_hint[APIOffsets_Hint.itemFlags],
        entrance: api_hint[APIOffsets_Hint.entrance],
    };
};

const convertAPJSHints = (ap_hints: APJS_Hint[]): Hint[] => {
    return ap_hints.map(convertAPJSHint);
};

export default class HintManager {
    #client: Client;
    #tagger: HintTagger;
    #hints: Map<string, Hint> = new Map();
    #hintCache: Hint[] = null;
    #hintResolutions: Map<string, (hint: Hint) => void> = new Map();
    #updateCallbacks: Set<() => void> = new Set();
    #hintQueue: Hint[] = [];
    #updateDelay = 100;
    #updateDelayTimer = 0;
    #multiWorldContext: MultiWorldContextData;

    constructor(hintTagger?: HintTagger) {
        this.#tagger = hintTagger;
    }

    setMultiWorldContext = (
        context: MultiWorldContextData,
        clearHints = false
    ) => {
        this.#multiWorldContext = context;
        if (clearHints) {
            this.#hints.clear();
            this.#tagger?.clear();
            this.#callListeners();
        }
    };

    initializeListeners = (client: Client) => {
        this.#client = client;
        this.#client.socket.on("disconnected", () => {
            this.#hints.clear();
            this.#tagger?.clear();
            this.#callListeners();
        });
        this.#client.items
            .on("hintsInitialized", (hints) => {
                this.#hints.clear();
                this.#tagger?.clear();
                this.#addHints(convertAPJSHints(hints));
            })
            .on("hintReceived", (hint) => this.#addHint(convertAPJSHint(hint)))
            .on("hintUpdated", (hint) => this.#addHint(convertAPJSHint(hint)));
    };

    addWebHostHints = (apiTracker: APITracker) => {
        const newHints: Map<string, Hint> = new Map();
        apiTracker.hints.forEach((playerHints) => {
            playerHints.hints.forEach((apiHint) => {
                const hint = convertAPIHint(apiHint, playerHints.team);
                const hintKey = computeHintId(hint);
                newHints.set(hintKey, hint);
            });
        });
        this.#addHints([...newHints.values()]);
    };

    #callListeners = () => {
        this.#hintCache = null;
        this.#updateCallbacks.forEach((callback) => callback());
    };

    /** Adds a hint, delays by 100ms for performance reasons*/
    #addHint = (hint: Hint) => {
        this.#hintQueue.push(hint);
        if (this.#updateDelayTimer === 0) {
            this.#updateDelayTimer = window.setTimeout(() => {
                this.#addHints(this.#hintQueue);
                this.#hintQueue = [];
                this.#updateDelayTimer = 0;
            }, this.#updateDelay);
        }
    };

    #addHints = (hints: Hint[]) => {
        const hintsForTagging = hints
            .filter(
                (hint) =>
                    hint.findingPlayer === this.#multiWorldContext?.trackedSlot
            )
            .map((hint) => ({
                location: hint.locationId,
                text: hintToText(this.#multiWorldContext, hint),
                status: hint.status,
            }));
        this.#tagger?.addHints(hintsForTagging);
        hints.forEach((hint) => {
            this.#hints.set(computeHintId(hint), hint);
            this.#hintResolutions.get(computeHintId(hint))?.(hint);
        });
        this.#callListeners();
    };

    get hints() {
        if (this.#hintCache === null) {
            this.#hintCache = [...this.#hints.values()];
            Object.freeze(this.#hintCache);
        }
        return this.#hintCache;
    }

    updateHintStatus = (hint: Hint, status: API.HintStatus) => {
        if (!this.canUpdate) {
            return;
        }
        this.#client.updateHint(
            { id: hint.locationId, player: hint.findingPlayer },
            status
        );
        const promise: Promise<Hint> = new Promise((resolve, _reject) => {
            this.#hintResolutions.set(computeHintId(hint), resolve);
        });
        return promise;
    };

    getHintHook = () => {
        return this.addHintListener;
    };

    addHintListener = (callback: () => void) => {
        this.#updateCallbacks.add(callback);
        return () => {
            this.#updateCallbacks.delete(callback);
        };
    };

    get canUpdate() {
        return this.#client?.authenticated && true;
    }
}
export { hintToText };
export type { Hint };
