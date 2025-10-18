import { randomShortId } from "../../utility/uuid";
import {
    TagCounterV2,
    TagDataV2,
    TagEntityType,
    TagSource,
    TagTypeV2,
} from "./tagManager";

const counters: TagCounterV2[] = [
    {
        counter_id: "star",
        icon_id: "star",
        display_name: "Star",
        color: "orange",
        show_total: true,
        count_filter: [["checked"]],
    },
    {
        counter_id: "square",
        icon_id: "square",
        display_name: "square",
        color: "#009900",
        show_total: true,
        count_filter: [["checked"]],
    },
    {
        counter_id: "circle",
        icon_id: "circle",
        display_name: "circle",
        color: "red",
        show_total: true,
        count_filter: [["checked"]],
    },
];

const types: TagTypeV2[] = [
    {
        display_name: "Star",
        type_id: "star",
        icon_id: "star",
        priority: 100,
        counter_id: "star",
        entity_type: TagEntityType.location,
        icon_color: "Orange",
        text_color: "grey",
        user_managed: true,
    },
    {
        display_name: "Square",
        type_id: "square",
        icon_id: "square",
        priority: 100,
        counter_id: "square",
        entity_type: TagEntityType.location,
        icon_color: "#009900",
        text_color: "grey",
        user_managed: true,
    },
    {
        display_name: "Circle",
        type_id: "circle",
        icon_id: "circle",
        priority: 100,
        counter_id: "circle",
        entity_type: TagEntityType.location,
        icon_color: "red",
        text_color: "grey",
        user_managed: true,
    },
    {
        display_name: "Ignored",
        type_id: "ignore",
        icon_id: "block",
        priority: 50,
        entity_type: TagEntityType.location,
        icon_color: "grey",
        text_color: "grey",
        user_managed: true,
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

    addTag = (type: string, locationId: number) => {
        if (!this.managedTypes.has(type)) {
            throw new Error(
                `Tag source ${this.id} does not support tagging with ${type} tags`
            );
        }
        const tag: TagDataV2 = {
            tag_id: randomShortId(),
            type_id: type,
            entity_id: locationId,
        };
        Object.freeze(tag);
        this.#tags.set(tag.tag_id, tag);
        this.#callUpdateCallbacks({ updated: [tag] });
        console.log("added tag");
    };

    removeTag = (tagId: string) => {
        this.#tags.delete(tagId);
        this.#callUpdateCallbacks({ removed: [tagId] });
    };
}

export { LocationTagger };
