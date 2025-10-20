import { Client, Hint, API } from "archipelago.js";
import HintTagger from "./tags/HintTagger";

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

export default class HintManager {
    #client: Client;
    #tagger: HintTagger;
    #hints: Map<string, Hint> = new Map();
    #hintCache: Hint[] = null;
    #hintResolutions: Map<string, (hint: Hint) => void> = new Map();
    #updateCallbacks: Set<() => void> = new Set();

    constructor(hintTagger: HintTagger) {
        this.#tagger = hintTagger;
    }

    initializeListeners = (client: Client) => {
        this.#client = client;
        this.#client.items
            .on("hintsInitialized", (hints) => this.#addHints(hints))
            .on("hintReceived", (hint) => this.#addHint(hint))
            .on("hintUpdated", (hint) => this.#addHint(hint));
    };

    #callListeners = () => {
        this.#hintCache = null;
        this.#updateCallbacks.forEach((callback) => callback());
    };

    /** Adds a hint */
    #addHint = (hint: Hint) => {
        if (hint.item.sender.slot === this.#client.players.self.slot) {
            this.#tagger.addHint(
                hint.item.locationId,
                hintToText(this.#client, hint),
                hint.status
            );
        }
        this.#hints.set(hint.uniqueKey, hint);
        if (this.#hintResolutions.has(hint.uniqueKey)) {
            this.#hintResolutions.get(hint.uniqueKey)(hint);
            this.#hintResolutions.delete(hint.uniqueKey);
        }
        this.#callListeners();
    };

    #addHints = (hints: Hint[]) => {
        const hintsForTagging = hints
            .filter(
                (hint) =>
                    hint.item.sender.slot === this.#client.players.self.slot
            )
            .map((hint) => ({
                location: hint.item.locationId,
                text: hintToText(this.#client, hint),
                status: hint.status,
            }));
        this.#tagger.addHints(hintsForTagging);
        hints.forEach((hint) => this.#hints.set(hint.uniqueKey, hint));
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
        this.#client.updateHint(
            { id: hint.item.locationId, player: hint.item.sender.slot },
            status
        );
        const promise: Promise<Hint> = new Promise((resolve, _reject) => {
            this.#hintResolutions.set(hint.uniqueKey, resolve);
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
}
