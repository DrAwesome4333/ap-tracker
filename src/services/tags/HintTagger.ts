import { API } from "archipelago.js";
import {
    normalItem,
    progressionItem,
    trapItem,
    usefulItem,
} from "../../constants/colors";
import { randomNumericId } from "../../utility/uuid";
import {
    TagCounterV2,
    TagDataV2,
    TagEntityType,
    TagSource,
    TagTypeV2,
    TagVariantDef,
    TagId,
} from "./tagManager";
import { OptionManager } from "../options/optionManager";

const baseHint: {
    entity_type: TagEntityType;
    priority: number;
    variants: TagVariantDef[];
} = {
    entity_type: TagEntityType.location,
    priority: 60,
    variants: [
        [
            ["ignored"],
            { icon_color: "yellow", icon_id: "flag_check", counter_id: null },
        ],
    ],
};

const hintTagTypes: { [status: number]: TagTypeV2[] } = {
    [API.HintStatus.unspecified]: [
        {
            ...baseHint,
            type_id: "hint_unspecified",
            icon_id: "bookmark_flag",
            icon_color: usefulItem,
            display_name: "Hint (Unspecified)",
            counter_id: "hint_unspecified",
            icon_spec: {
                fill: 1,
            },
        },
    ],
    [API.HintStatus.no_priority]: [
        {
            ...baseHint,
            type_id: "hint_no_priority",
            icon_id: "bookmark_flag",
            icon_color: normalItem,
            display_name: "Hint (No priority)",
            counter_id: "hint_no_priority",
            icon_spec: {
                fill: 1,
            },
        },
    ],
    [API.HintStatus.avoid]: [
        {
            ...baseHint,
            type_id: "hint_avoid",
            icon_id: "bomb",
            icon_color: trapItem,
            display_name: "Hint (avoid)",
            counter_id: "hint_avoid",
        },
    ],
    [API.HintStatus.priority]: [
        {
            ...baseHint,
            type_id: "hint_priority",
            icon_id: "flag",
            icon_color: progressionItem,
            display_name: "Hint (Priority)",
            counter_id: "hint_priority",
        },
    ],
    [API.HintStatus.found]: [
        {
            ...baseHint,
            type_id: "hint_found",
            icon_id: "flag_check",
            icon_color: "green",
            display_name: "Hint (Found)",
            counter_id: "hint_found",
            variants: null,
        },
    ],
};

// create no counter versions of types, create array with all types
const hintTagTypeArray = [];
Object.entries(hintTagTypes).forEach(([_name, types]) => {
    const counterFreeCopy = { ...types[0] };
    counterFreeCopy.counter_id = null;
    counterFreeCopy.type_id += "_no_counter";
    types.push(counterFreeCopy);
    Object.freeze(types[0]);
    Object.freeze(types[1]);
    hintTagTypeArray.push(...types);
});
Object.freeze(hintTagTypeArray);

const hintCounter_unspecified: TagCounterV2 = {
    counter_id: "hint_unspecified",
    display_name: "Hint (Unspecified)",
    color: usefulItem,
    icon_id: "bookmark_flag",
    show_total: false,
};

const hintCounter_no_priority: TagCounterV2 = {
    counter_id: "hint_no_priority",
    display_name: "Hint (No Priority)",
    color: normalItem,
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

const nameToStatus = [
    {
        status: API.HintStatus.unspecified,
        name: "unspecified",
    },
    {
        status: API.HintStatus.no_priority,
        name: "no_priority",
    },
    {
        status: API.HintStatus.priority,
        name: "priority",
    },
    {
        status: API.HintStatus.avoid,
        name: "avoid",
    },
    {
        status: API.HintStatus.found,
        name: "found",
    },
];

class HintTagger implements TagSource {
    id = "hint_tagger";
    #hintTags: Map<TagId, TagDataV2> = new Map();
    #hints: Map<
        number,
        { location: number; text: string; status: API.HintStatus }
    > = new Map();
    #locationToTag: Map<number, TagId> = new Map();
    #allowHintTypes: Set<API.HintStatus> = new Set();
    #countedHintTypes: Set<API.HintStatus> = new Set();
    #updateCallbacks: Set<
        (tagChanges: { updated?: TagDataV2[]; removed?: TagId[] }) => void
    > = new Set();
    constructor(optionManager: OptionManager) {
        const optionUpdate = () => {
            const allowedCounters = optionManager.getOptionValue(
                "Tags:hint_settings",
                "global"
            ) as { tag: string[]; counter: string[] };
            const allowedHintTypes = nameToStatus
                .filter((s) => allowedCounters.tag.includes(s.name))
                .map((s) => s.status);
            const allowedCounterTypes = nameToStatus
                .filter((s) => allowedCounters.counter.includes(s.name))
                .map((s) => s.status);
            this.#allowHintTypes = new Set(allowedHintTypes);
            this.#countedHintTypes = new Set(allowedCounterTypes);
            this.#refreshHints();
        };
        const subscriber = optionManager.getSubscriberCallback(
            "Tags:hint_settings",
            "global"
        );
        subscriber(optionUpdate);
        optionUpdate();
    }

    getCounters = () => [
        hintCounter_unspecified,
        hintCounter_no_priority,
        hintCounter_avoid,
        hintCounter_priority,
        hintCounter_found,
    ];

    getTypes = () => hintTagTypeArray;
    getTags = (ids?: TagId[]) => {
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
            removed?: TagId[];
        }) => void
    ) => {
        this.#updateCallbacks.add(callback);
        return () => {
            this.#updateCallbacks.delete(callback);
        };
    };

    removeHints = (locationIds: number[]) => {
        const filteredIds = locationIds.filter((id) =>
            this.#locationToTag.has(id)
        );
        const tagIds = filteredIds.map((id) => this.#locationToTag.get(id));

        tagIds.forEach((tagId) => this.#hintTags.delete(tagId));
        filteredIds.forEach((locationId) => {
            this.#locationToTag.delete(locationId);
            this.#hints.delete(locationId);
        });
        this.#updateCallbacks.forEach((callback) =>
            callback({ removed: tagIds })
        );
    };

    removeHint = (location: number) => {
        this.removeHints([location]);
    };

    addHints = (
        hints: { location: number; text: string; status: API.HintStatus }[]
    ) => {
        hints.forEach((hint) => {
            this.#hints.set(hint.location, hint);
        });
        this.#refreshHints();
    };

    addHint = (location: number, text: string, status: API.HintStatus) => {
        this.addHints([{ location, text, status }]);
    };

    #refreshHints = () => {
        const tagsToRemove = [];
        const newTags = [];
        this.#hints.forEach((hint) => {
            const tagAllowed = this.#allowHintTypes.has(hint.status);
            const useCounterType = this.#countedHintTypes.has(hint.status);
            const existingTag = this.#hintTags.get(
                this.#locationToTag.get(hint.location)
            );
            const typeIndex = useCounterType ? 0 : 1;
            const desiredTagType = hintTagTypes[hint.status][typeIndex];

            if (tagAllowed && existingTag?.type_id === desiredTagType.type_id) {
                return; // no need to change anything
            }

            if (existingTag) {
                tagsToRemove.push(existingTag.tag_id);
            }

            if (!tagAllowed) {
                return; // tag only needed to be removed
            }

            // create new tag
            const tag: TagDataV2 = {
                tag_id: randomNumericId(),
                type_id: desiredTagType.type_id,
                data: hint.text,
                entity_id: hint.location,
            };
            this.#locationToTag.set(hint.location, tag.tag_id);
            this.#hintTags.set(tag.tag_id, tag);
            newTags.push(tag);
        });
        tagsToRemove.forEach((tagId) => this.#hintTags.delete(tagId));

        this.#updateCallbacks.forEach((callback) =>
            callback({
                updated: newTags,
                removed: tagsToRemove,
            })
        );
    };

    clear = () => {
        this.removeHints([...this.#locationToTag.keys()]);
    };
}

export default HintTagger;
