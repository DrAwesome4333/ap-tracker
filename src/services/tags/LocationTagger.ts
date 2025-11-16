import { randomNumericId } from "../../utility/uuid";
import MultiWorldContext from "../MultiInfo/MultiWorldContext";
import { DB_STORE_KEYS, SaveData } from "../saveData";
import {
    TagCounterV2,
    TagDataV2,
    TagEntityType,
    TagSource,
    TagTypeV2,
    TagId,
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

Object.freeze(types);
types.forEach((tagType) => Object.freeze(tagType));

class LocationTagger implements TagSource {
    id = "location_tagger";
    managedTypes = new Set(types.map((tagType) => tagType.type_id));
    #multiWorldSaveId: string;
    #slot: number;
    #tags: Map<TagId, TagDataV2> = new Map();
    #updateCallbacks: Set<
        (tagUpdates: { updated?: TagDataV2[]; removed?: TagId[] }) => void
    > = new Set();

    constructor() {
        MultiWorldContext.addDeleteCallback(this.deleteTags);
    }

    #callUpdateCallbacks = (updates: {
        updated?: TagDataV2[];
        removed?: TagId[];
    }) => {
        this.#updateCallbacks.forEach((callback) => callback(updates));
    };

    getTags = (tagIds?: TagId[]) => {
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
            removed?: TagId[];
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

    updateTag = (tagId: TagId, text: string) => {
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
            tag_id: randomNumericId(),
            type_id: type,
            entity_id: locationId,
            data: text,
        };
        Object.freeze(tag);
        this.#tags.set(tag.tag_id, tag);
        this.#callUpdateCallbacks({ updated: [tag] });
        this.saveTags();
    };

    removeTag = (tagId: TagId) => {
        this.#tags.delete(tagId);
        this.#callUpdateCallbacks({ removed: [tagId] });
        this.saveTags();
    };

    loadTags = (multiWorldSaveId: string, slot: number) => {
        this.#multiWorldSaveId = multiWorldSaveId;
        this.#slot = slot;
        const removedTags = [...this.#tags.entries()].map(([id, _]) => id);
        this.#tags.clear();
        this.#callUpdateCallbacks({ removed: removedTags });

        SaveData.getItem(DB_STORE_KEYS.tags, [multiWorldSaveId, slot]).then(
            (value: {
                multi_save_id: string;
                slot: number;
                tags: TagDataV2[];
            }) => {
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
        const result = await SaveData.storeItem(DB_STORE_KEYS.tags, {
            multi_save_id: this.#multiWorldSaveId,
            slot_number: this.#slot,
            tags: [...this.#tags.values()],
        });
        return result;
    };

    deleteTags = async (multi_save_id: string, slot_number?: number) => {
        if (slot_number !== undefined) {
            await SaveData.deleteItem(DB_STORE_KEYS.tags, [
                multi_save_id,
                slot_number,
            ]);
            return;
        }
    };
}

export { LocationTagger };
