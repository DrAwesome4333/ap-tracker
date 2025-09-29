import { randomShortId } from "../../utility/uuid";
import {
    TagCounterV2,
    TagDataV2,
    TagEntityType,
    TagSource,
    TagTypeV2,
} from "./tagManager";

const hintTag: TagTypeV2 = {
    type_id: "hint",
    icon_id: "flag",
    icon_color: "red",
    display_name: "Hint",
    entity_type: TagEntityType.location,
    counter_id: "hint",
    variants: [
        [["checked"], { icon_color: "green", counter_id: null }],
        [["ignored"], { icon_color: "yellow", counter_id: null }],
    ],
};

const hintCounter: TagCounterV2 = {
    counter_id: "hint",
    display_name: "hint count",
    color: "red",
    icon_id: "flag",
    show_total: false,
};

class HintTagger implements TagSource {
    id = "hint_tagger";
    #hintTags: Map<string, TagDataV2> = new Map();
    #locationToTag: Map<number, string> = new Map();
    #updateCallbacks: Set<
        (tagChanges: { updated?: TagDataV2[]; removed?: string[] }) => void
    > = new Set();
    constructor() {}

    getCounters = () => [hintCounter];
    getTypes = () => [hintTag];
    getTags = (ids?: string[]) => {
        if (ids) {
            const results = ids
                .map((id) => this.#hintTags.get(id))
                .filter((x) => x && true);
            return results;
        }
        return [...this.#hintTags.values()];
    };
    addUpdateCallback = (
        callback: (tagChanges: {
            updated?: TagDataV2[];
            removed?: string[];
        }) => void
    ) => {
        this.#updateCallbacks.add(callback);
        return () => {
            this.#updateCallbacks.delete(callback);
        };
    };

    removeHint = (locationId: number) => {
        if (!this.#locationToTag.has(locationId)) {
            return;
        }
        const tagId = this.#locationToTag.get(locationId);
        this.#hintTags.delete(tagId);
        this.#locationToTag.delete(locationId);
        this.#updateCallbacks.forEach((callback) =>
            callback({ removed: [tagId] })
        );
    };

    removeHints = (locationIds: number[]) => {
        const filteredIds = locationIds.filter((id) =>
            this.#locationToTag.has(id)
        );
        const tagIds = filteredIds.map((id) => this.#locationToTag.get(id));

        tagIds.forEach((tagId) => this.#hintTags.delete(tagId));
        filteredIds.forEach((locationId) =>
            this.#locationToTag.delete(locationId)
        );
        this.#updateCallbacks.forEach((callback) =>
            callback({ removed: tagIds })
        );
    };

    addHint = (locationId: number, text: string) => {
        if (this.#locationToTag.has(locationId)) {
            this.removeHint(locationId);
        }
        const tag: TagDataV2 = {
            tag_id: randomShortId(),
            type_id: hintTag.type_id,
            data: text,
            entity_id: locationId,
        };
        this.#locationToTag.set(locationId, tag.tag_id);
        this.#hintTags.set(tag.tag_id, tag);
        this.#updateCallbacks.forEach((callback) =>
            callback({ updated: [tag] })
        );
    };

    addHints = (locationIds: number[], texts: string[]) => {
        locationIds.forEach((locationId, index) => {
            if (this.#locationToTag.has(locationId)) {
                this.removeHint(locationId);
            }
            const tag: TagDataV2 = {
                tag_id: randomShortId(),
                type_id: hintTag.type_id,
                data: texts[index],
                entity_id: locationId,
            };
            this.#locationToTag.set(locationId, tag.tag_id);
            this.#hintTags.set(tag.tag_id, tag);
        });
        this.#updateCallbacks.forEach((callback) =>
            callback({
                updated: locationIds.map((id) =>
                    this.#hintTags.get(this.#locationToTag.get(id))
                ),
            })
        );
    };
}

export default HintTagger;
