import { API } from "archipelago.js";
import {
    normalItem,
    progressionItem,
    trapItem,
    usefulItem,
} from "../../constants/colors";
import { randomShortId } from "../../utility/uuid";
import {
    TagCounterV2,
    TagDataV2,
    TagEntityType,
    TagSource,
    TagTypeV2,
} from "./tagManager";

const hintTag_unspecified: TagTypeV2 = {
    type_id: "hint_unspecified",
    icon_id: "bookmark_flag",
    icon_color: usefulItem,
    display_name: "Hint (Unspecified)",
    entity_type: TagEntityType.location,
    counter_id: "hint_unspecified_no-priority",
    priority: 60,
    variants: [
        [
            ["ignored"],
            { icon_color: "yellow", icon_id: "flag_check", counter_id: null },
        ],
    ],
};

const hintTag_noPriority: TagTypeV2 = {
    type_id: "hint_no_priority",
    icon_id: "bookmark_flag",
    icon_color: normalItem,
    display_name: "Hint (No Priority)",
    entity_type: TagEntityType.location,
    counter_id: "hint_unspecified_no-priority",
    priority: 60,
    variants: [
        [
            ["ignored"],
            { icon_color: "yellow", icon_id: "flag_check", counter_id: null },
        ],
    ],
};

const hintTag_avoid: TagTypeV2 = {
    type_id: "hint_avoid",
    icon_id: "bomb",
    icon_color: trapItem,
    display_name: "Hint (Avoid)",
    entity_type: TagEntityType.location,
    counter_id: "hint_avoid",
    priority: 60,
    variants: [
        [
            ["ignored"],
            { icon_color: "yellow", icon_id: "flag_check", counter_id: null },
        ],
    ],
};

const hintTag_priority: TagTypeV2 = {
    type_id: "hint_priority",
    icon_id: "flag",
    icon_color: progressionItem,
    display_name: "Hint (Priority)",
    entity_type: TagEntityType.location,
    counter_id: "hint_priority",
    priority: 60,
    variants: [
        [
            ["ignored"],
            { icon_color: "yellow", icon_id: "flag_check", counter_id: null },
        ],
    ],
};

const hintTag_found: TagTypeV2 = {
    type_id: "hint_found",
    icon_id: "flag_check",
    icon_color: "green",
    display_name: "Hint (Found)",
    entity_type: TagEntityType.location,
    priority: 60,
    counter_id: "hint_found",
};

const hintCounter_unspecified_no_priority: TagCounterV2 = {
    counter_id: "hint_unspecified_no-priority",
    display_name: "Hint (Unspecified/No Priority)",
    color: usefulItem,
    icon_id: "bookmark_flag",
    show_total: false,
};

const hintCounter_avoid: TagCounterV2 = {
    counter_id: "hint_avoid",
    display_name: "Hint (Avoid)",
    color: trapItem,
    icon_id: "bomb",
    show_total: false,
};

const hintCounter_priority: TagCounterV2 = {
    counter_id: "hint_priority",
    display_name: "Hint (Priority)",
    color: progressionItem,
    icon_id: "flag",
    show_total: false,
};

const hintCounter_found: TagCounterV2 = {
    counter_id: "hint_found",
    display_name: "Hint (Found)",
    color: "green",
    icon_id: "flag_check",
    show_total: false,
};

const hintStatusTypeMap: { [status: number]: TagTypeV2 } = {
    [API.HintStatus.unspecified]: hintTag_unspecified,
    [API.HintStatus.no_priority]: hintTag_noPriority,
    [API.HintStatus.avoid]: hintTag_avoid,
    [API.HintStatus.priority]: hintTag_priority,
    [API.HintStatus.found]: hintTag_found,
};

class HintTagger implements TagSource {
    id = "hint_tagger";
    #hintTags: Map<string, TagDataV2> = new Map();
    #locationToTag: Map<number, string> = new Map();
    #updateCallbacks: Set<
        (tagChanges: { updated?: TagDataV2[]; removed?: string[] }) => void
    > = new Set();
    constructor() {}

    getCounters = () => [
        hintCounter_unspecified_no_priority,
        hintCounter_avoid,
        hintCounter_priority,
        hintCounter_found,
    ];
    getTypes = () => [
        hintTag_unspecified,
        hintTag_noPriority,
        hintTag_avoid,
        hintTag_priority,
        hintTag_found,
    ];
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

    addHint = (locationId: number, text: string, status: number) => {
        if (this.#locationToTag.has(locationId)) {
            this.removeHint(locationId);
        }
        const tagType = hintStatusTypeMap[status];
        const tag: TagDataV2 = {
            tag_id: randomShortId(),
            type_id: tagType.type_id,
            data: text,
            entity_id: locationId,
        };
        this.#locationToTag.set(locationId, tag.tag_id);
        this.#hintTags.set(tag.tag_id, tag);
        this.#updateCallbacks.forEach((callback) =>
            callback({ updated: [tag] })
        );
    };

    addHints = (locationIds: number[], texts: string[], statuses: number[]) => {
        locationIds.forEach((locationId, index) => {
            if (this.#locationToTag.has(locationId)) {
                this.removeHint(locationId);
            }
            const tagType = hintStatusTypeMap[statuses[index]];
            const tag: TagDataV2 = {
                tag_id: randomShortId(),
                type_id: tagType.type_id,
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
