import { randomShortId } from "../../utility/uuid";
import { DB_STORE_KEYS, SaveData } from "../saveData";
import {
    TagCounterV2,
    TagDataV2,
    TagEntityType,
    TagSource,
    TagTypeV2,
} from "./tagManager";

const uniqueTagInfo = [
    {
        display_name: "Star",
        type_id: "star",
        icon_id: "star",
        icon_color: "Orange",
    },
    {
        display_name: "Circle",
        type_id: "circle",
        icon_id: "circle",
        icon_color: "Red",
    },
    {
        display_name: "Square",
        type_id: "square",
        icon_id: "square",
        icon_color: "Green",
    },
    {
        display_name: "Money",
        type_id: "money_bag",
        icon_id: "money_bag",
        icon_color: "#DE4C8A",
    },
];

const colors = [
    "red",
    "orange",
    "gold",
    "green",
    "cyan",
    "blue",
    "purple",
    "pink",
    "brown",
];
for (let i = 1; i < 10; i++) {
    uniqueTagInfo.push({
        display_name: `Number ${i}`,
        type_id: `number_${i}`,
        icon_id: `counter_${i}`,
        icon_color: colors[i],
    });
}

const counters: TagCounterV2[] = uniqueTagInfo.map((info) => ({
    counter_id: info.type_id,
    icon_id: info.icon_id,
    display_name: info.display_name,
    color: info.icon_color,
    show_total: true,
    count_filter: [["checked"]],
}));
// [
//     {
//         counter_id: "star",
//         icon_id: "star",
//         display_name: "Star",
//         color: "orange",
//         show_total: true,
//         count_filter: [["checked"]],
//     },
//     {
//         counter_id: "square",
//         icon_id: "square",
//         display_name: "square",
//         color: "#009900",
//         show_total: true,
//         count_filter: [["checked"]],
//     },
//     {
//         counter_id: "circle",
//         icon_id: "circle",
//         display_name: "circle",
//         color: "red",
//         show_total: true,
//         count_filter: [["checked"]],
//     },
// ];

const types: TagTypeV2[] = [
    ...uniqueTagInfo.map((info) => ({
        ...info,
        priority: 100,
        counter_id: info.type_id,
        entity_type: TagEntityType.location,
        text_color: "grey",
        user_managed: true,
        allows_text: true,
    })),
    {
        display_name: "Ignored",
        type_id: "ignore",
        icon_id: "block",
        priority: 50,
        entity_type: TagEntityType.location,
        icon_color: "grey",
        text_color: "grey",
        user_managed: true,
        allows_text: true,
        effects: {
            ignored: true,
        },
        icon_spec: {
            fill: 0,
        },
    },
];
// [
//     {
//         display_name: "Star",
//         type_id: "star",
//         icon_id: "star",
//         priority: 100,
//         counter_id: "star",
//         entity_type: TagEntityType.location,
//         icon_color: "Orange",
//         text_color: "grey",
//         user_managed: true,
//         allows_text: true,
//     },
//     {
//         display_name: "Square",
//         type_id: "square",
//         icon_id: "square",
//         priority: 100,
//         counter_id: "square",
//         entity_type: TagEntityType.location,
//         icon_color: "#009900",
//         text_color: "grey",
//         user_managed: true,
//         allows_text: true,
//     },
//     {
//         display_name: "Circle",
//         type_id: "circle",
//         icon_id: "circle",
//         priority: 100,
//         counter_id: "circle",
//         entity_type: TagEntityType.location,
//         icon_color: "red",
//         text_color: "grey",
//         user_managed: true,
//         allows_text: true,
//     },
//     {
//         display_name: "Ignored",
//         type_id: "ignore",
//         icon_id: "block",
//         priority: 50,
//         entity_type: TagEntityType.location,
//         icon_color: "grey",
//         text_color: "grey",
//         user_managed: true,
//         effects: {
//             ignored: true,
//         },
//         icon_spec: {
//             fill: 0,
//         },
//     },
// ];

Object.freeze(types);
types.forEach((tagType) => Object.freeze(tagType));

class LocationTagger implements TagSource {
    id = "location_tagger";
    managedTypes = new Set(types.map((tagType) => tagType.type_id));
    #seed: string;
    #slot: string;
    #tags: Map<string, TagDataV2> = new Map();
    #updateCallbacks: Set<
        (tagUpdates: { updated?: TagDataV2[]; removed?: string[] }) => void
    > = new Set();

    #callUpdateCallbacks = (updates: {
        updated?: TagDataV2[];
        removed?: string[];
    }) => {
        this.#updateCallbacks.forEach((callback) => callback(updates));
    };

    getTags = (tagIds?: string[]) => {
        return tagIds
            ? tagIds
                  .map((tagId) => this.#tags.get(tagId))
                  .filter((tag) => tag && true)
            : [...this.#tags.values()];
    };

    getTypes = () => {
        return types;
    };

    getCounters = () => counters;

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

    queryTags = (type: string, locationId: number): TagDataV2[] => {
        return [...this.#tags.values()].filter(
            (tag) => tag.entity_id === locationId && tag.type_id === type
        );
    };

    updateTag = (tagId: string, text: string) => {
        const oldTag = this.#tags.get(tagId);
        if (!oldTag) {
            return;
        }
        const newTag = { ...oldTag, data: text };
        Object.freeze(newTag);
        this.#tags.set(tagId, newTag);
        this.#callUpdateCallbacks({ updated: [newTag] });
        this.saveTags();
    };

    addTag = (type: string, locationId: number, text?: string) => {
        if (!this.managedTypes.has(type)) {
            throw new Error(
                `Tag source ${this.id} does not support tagging with ${type} tags`
            );
        }
        const tag: TagDataV2 = {
            tag_id: randomShortId(),
            type_id: type,
            entity_id: locationId,
            data: text,
        };
        Object.freeze(tag);
        this.#tags.set(tag.tag_id, tag);
        this.#callUpdateCallbacks({ updated: [tag] });
        this.saveTags();
    };

    removeTag = (tagId: string) => {
        this.#tags.delete(tagId);
        this.#callUpdateCallbacks({ removed: [tagId] });
        this.saveTags();
    };

    loadTags = (seedName: string, slot: number) => {
        this.#seed = seedName;
        this.#slot = slot.toString();
        const removedTags = [...this.#tags.entries()].map(([id, _]) => id);
        this.#tags.clear();
        this.#callUpdateCallbacks({ removed: removedTags });

        SaveData.getItem(DB_STORE_KEYS.tags, [seedName, slot.toString()]).then(
            (value: { seed: string; slot: string; tags: TagDataV2[] }) => {
                if (!value?.tags) {
                    return;
                }
                value.tags.forEach((tag) => {
                    this.#tags.set(tag.tag_id, tag);
                });
                this.#callUpdateCallbacks({ updated: value.tags });
            }
        );
    };

    saveTags = async () => {
        return SaveData.storeItem(DB_STORE_KEYS.tags, {
            seed: this.#seed,
            slot: this.#slot,
            tags: [...this.#tags.values()],
        });
    };
}

export { LocationTagger };
