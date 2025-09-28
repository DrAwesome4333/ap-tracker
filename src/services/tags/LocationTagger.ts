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
        counter_id: "star_1",
        icon_id: "star",
        display_name: "Star 1",
        color: "orange",
        show_total: true,
        count_filter: [["checked"]],
    },
    {
        counter_id: "star_2",
        icon_id: "star",
        display_name: "Star 2",
        color: "blue",
        show_total: false,
    },
    {
        counter_id: "star_3",
        icon_id: "star",
        display_name: "Star 3",
        color: "green",
        show_total: true,
        count_filter: [["ignored"]],
        total_filter: [["checked"]],
    },
];

const types: TagTypeV2[] = [
    {
        display_name: "Star 1",
        type_id: "star_1",
        icon_id: "star",
        priority: 100,
        counter_id: "star_1",
        entity_type: TagEntityType.location,
        icon_color: "Orange",
        text_color: "grey",
        user_managed: true,
    },
    {
        display_name: "Star 2",
        type_id: "star_2",
        icon_id: "star",
        priority: 100,
        counter_id: "star_2",
        entity_type: TagEntityType.location,
        icon_color: "blue",
        text_color: "grey",
        user_managed: true,
    },
    {
        display_name: "Star 3",
        type_id: "star_3",
        icon_id: "star",
        priority: 100,
        counter_id: "star_3",
        entity_type: TagEntityType.location,
        icon_color: "green",
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
            flag_location: ["ignored"],
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
