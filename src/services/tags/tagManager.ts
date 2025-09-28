import { naturalSort } from "../../utility/comparisons";
// import { randomShortId, randomUUID } from "../../utility/uuid";

/** A list of properties that must be true on the entities status for a tag */
type TagCondition = string[];
type TagEntityId = number | string;
interface TagCounterV2 {
    /** id for the counter */
    counter_id: string;
    /** Display name for the counter */
    display_name: string;
    /** What color to display the counter icon */
    color: string;
    /** Which icon to use for the counter */
    icon_id: string;
    /** If true counter wil display "count/total", else it will display as "count" */
    show_total: boolean;
    /**
     * A list of conditions that can be met to count towards the count for this counter.
     * Only one condition must be met to count
     * Defaults to always true
     */
    count_filter?: TagCondition[];
    /**
     * A list of conditions that can be met to count towards the total for this counter.
     * Only one condition must be met to count
     * Defaults to true
     */
    total_filter?: TagCondition[];
}

type TagCounterResult = {
    counter_id: string;
    display_name: string;
    color: string;
    icon_id: string;
    count: number;
    total?: number;
};

type TagVariantDef = [string[], TagVariantType];

interface TagDataV2 {
    type_id: string;
    tag_id: string;
    entity_id: number | string;
    data?: string | number;
}

interface TagTypeV2Data {
    display_name: string;
    type_id: string;
    icon_id: string;
    entity_type: TagEntityType;
    icon_color?: string;
    text_color?: string;
    priority?: number;
    variants?: TagVariantDef[];
    effects?: { [effect_name: string]: unknown };
    counter_id?: string;
    user_managed?: boolean;
}

interface TagTypeV2 {
    display_name: string;
    type_id: string;
    icon_id: string;
    source_id: string;
    entity_type: TagEntityType;
    icon_color?: string;
    text_color?: string;
    priority?: number;
    variants?: TagVariantDef[];
    effects?: { [effect_name: string]: unknown };
    counter_id?: string | string[];
    user_managed?: boolean;
}

interface TagVariantType {
    icon_color?: string;
    icon_id?: string;
    text_color?: string;
    counter_id?: string;
}

interface TagSource {
    id: string;
    getTags: (tags?: string[]) => TagDataV2[];
    getTypes: () => TagTypeV2Data[];
    getCounters: () => TagCounterV2[];
    /** Subscribes provided callback to all updates to tags in this source, returns a clean up call */
    addUpdateCallback: (
        callback: (tagChanges: {
            updated?: TagDataV2[];
            removed?: string[];
        }) => void
    ) => () => void;
}

enum TagEntityType {
    location = "location",
}

const computeVariantName = (tagTypeId: string, variant: TagVariantDef) => {
    return `__${tagTypeId}_${variant[0].join("_")}`;
};

class TagManager {
    #tagSources: Map<string, TagSource> = new Map();
    #sourceCleanUpCalls: Map<string, () => void> = new Map();
    #tagTypes: Map<string, TagTypeV2> = new Map();
    #tagTypeCache: TagTypeV2[] = null;
    #tags: Map<string, TagDataV2> = new Map();
    #tagsByEntity: Map<TagEntityType, Map<TagEntityId, Set<string>>> =
        new Map();
    #tagsByEntityCache: Map<TagEntityType, Map<TagEntityId, string[]>> =
        new Map();
    #tagsByType: Map<string, Set<string>> = new Map();
    #tagListUpdateCallbacks: Map<
        TagEntityType,
        Map<TagEntityId, Set<() => void>>
    > = new Map();
    #tagUpdateCallbacks: Map<string, Set<() => void>> = new Map();
    #typeListUpdateCallbacks: Set<() => void> = new Set();
    #tagCounters: Map<string, TagCounterV2> = new Map();
    #tagCounterResultCache: Map<string, TagCounterResult[]> = new Map();

    constructor() {}
    #evaluateTagCondition = (
        conditions: TagCondition[],
        status: { [statusName: string]: boolean }
    ) => {
        for (const condition of conditions) {
            if (condition.every((status_name) => status[status_name])) {
                return true;
            }
        }
        return false;
    };

    #evaluateCounter = (
        counterId: string,
        status: { [statusName: string]: boolean },
        counters: Map<string, TagCounterResult>
    ) => {
        const counter = this.#tagCounters.get(counterId);
        const count = this.#evaluateTagCondition(
            counter.count_filter ?? [[]],
            status
        );
        const total =
            counter.show_total &&
            this.#evaluateTagCondition(counter.total_filter ?? [[]], status);
        const result: TagCounterResult = counters.get(counter.counter_id) ?? {
            counter_id: counter.counter_id,
            display_name: counter.display_name,
            color: counter.color,
            icon_id: counter.icon_id,
            count: 0,
            total: counter.show_total ? 0 : null,
        };
        if (count) {
            result.count++;
        }
        if (total) {
            result.total++;
        }
        counters.set(counter.counter_id, result);
        return counters;
    };

    getCounterResults = (
        entityType: TagEntityType,
        entityIds: TagEntityId[],
        entityStatuses: { [statusName: string]: boolean }[],
        cacheKey?: string
    ): TagCounterResult[] => {
        if (cacheKey && this.#tagCounterResultCache.has(cacheKey)) {
            return this.#tagCounterResultCache.get(cacheKey);
        }
        const counters: Map<string, TagCounterResult> = new Map();
        const tagsForType: Map<
            TagEntityId,
            Set<string>
        > = this.#tagsByEntity.get(entityType) ?? new Map();
        entityIds.forEach((entityId, index) => {
            const tagsOnEntity = tagsForType.get(entityId) ?? new Set();
            tagsOnEntity.forEach((tagId) => {
                const tag = this.getTagById(tagId);
                const tagType = this.getTagType(
                    tag?.type_id,
                    entityStatuses[index]
                );
                if (
                    tagType.counter_id &&
                    typeof tagType.counter_id === "string"
                ) {
                    this.#evaluateCounter(
                        tagType.counter_id,
                        entityStatuses[index],
                        counters
                    );
                } else if (
                    tagType.counter_id &&
                    Array.isArray(tagType.counter_id)
                ) {
                    tagType.counter_id.forEach((counter_id) =>
                        this.#evaluateCounter(
                            counter_id,
                            entityStatuses[index],
                            counters
                        )
                    );
                }
            });
        });
        const results = [...counters.values()];
        results.sort((a, b) => naturalSort(a.counter_id, b.counter_id));
        Object.freeze(results);
        this.#tagCounterResultCache.set(cacheKey, results);
        return results;
    };

    getTypeList = () => {
        if (!this.#tagTypeCache) {
            this.#tagTypeCache = [...this.#tagTypes.entries()].map(
                ([_typeId, tagType]) => tagType
            );
        }
        return this.#tagTypeCache;
    };

    getTagType = (
        typeId: string,
        status?: { [status_name: string]: boolean }
    ) => {
        let tagType = this.#tagTypes.get(typeId) ?? null;
        if (tagType?.variants) {
            for (const variantDef of tagType.variants) {
                if (variantDef[0].every((status_name) => status[status_name])) {
                    tagType = this.#tagTypes.get(
                        computeVariantName(typeId, variantDef)
                    );
                    break;
                }
            }
        }
        return tagType;
    };

    getTagById = (tagId: string) => {
        return this.#tags.get(tagId) ?? null;
    };

    getTagIdsOnEntity = (
        entityType: TagEntityType,
        entityId: string | number
    ) => {
        let cache = this.#tagsByEntityCache.get(entityType)?.get(entityId);
        if (!cache) {
            const entityTypeCache: Map<string | number, string[]> =
                this.#tagsByEntityCache.get(entityType) ?? new Map();
            cache = [
                ...(this.#tagsByEntity.get(entityType)?.get(entityId) ?? []),
            ];
            Object.freeze(cache);
            entityTypeCache.set(entityId, cache);
            this.#tagsByEntityCache.set(entityType, entityTypeCache);
        }
        return cache;
    };

    addTagListUpdateCallback = (
        entityType: TagEntityType,
        entityId: string | number,
        callback: () => void
    ) => {
        const typeCallbacks: Map<
            string | number,
            Set<() => void>
        > = this.#tagListUpdateCallbacks.get(entityType) ?? new Map();
        const entityCallbacks: Set<() => void> =
            typeCallbacks.get(entityId) ?? new Set();
        this.#tagListUpdateCallbacks.set(entityType, typeCallbacks);
        typeCallbacks.set(entityId, entityCallbacks);
        entityCallbacks.add(callback);
        // return a clean up call
        return () => {
            this.#tagListUpdateCallbacks
                .get(entityType)
                ?.get(entityId)
                ?.delete(callback);
            if (
                this.#tagListUpdateCallbacks.get(entityType)?.get(entityId)
                    ?.size === 0
            ) {
                this.#tagListUpdateCallbacks.get(entityType).delete(entityId);
            }
        };
    };

    addTagUpdateCallback = (tagId: string, callback: () => void) => {
        const tagIdCallbacks = this.#tagUpdateCallbacks.get(tagId) ?? new Set();
        tagIdCallbacks.add(callback);
        this.#tagUpdateCallbacks.set(tagId, tagIdCallbacks);
        return () => {
            this.#tagUpdateCallbacks.get(tagId)?.delete(callback);
            if (this.#tagUpdateCallbacks.get(tagId)?.size === 0) {
                this.#tagUpdateCallbacks.delete(tagId);
            }
        };
    };

    addTypeListUpdateCallback = (callback: () => void) => {
        this.#typeListUpdateCallbacks.add(callback);
        return () => {
            this.#typeListUpdateCallbacks.delete(callback);
        };
    };

    addCounterUpdateCallback = (
        entityType: TagEntityType,
        entityIds: TagEntityId[],
        callback: () => void,
        cacheKey: string
    ) => {
        const callbackPlus = () => {
            this.#tagCounterResultCache.delete(cacheKey);
            callback();
        };
        const cleanUpCalls = entityIds.map((entityId) =>
            this.addTagListUpdateCallback(entityType, entityId, callbackPlus)
        );
        return () => {
            this.#tagCounterResultCache.delete(cacheKey);
            cleanUpCalls.forEach((callback) => callback());
        };
    };

    getTagListUpdateCallbackHook = (
        entityType: TagEntityType,
        entityId: TagEntityId
    ) => {
        return (callback: () => void) =>
            this.addTagListUpdateCallback(entityType, entityId, callback);
    };

    getTagUpdateCallbackHook = (tagId: string) => {
        return (callback: () => void) =>
            this.addTagUpdateCallback(tagId, callback);
    };

    getTypeListUpdateCallbackHook = () => {
        return (callback: () => void) =>
            this.addTypeListUpdateCallback(callback);
    };

    getCounterUpdateCallbackHook = (
        entityType: TagEntityType,
        entityIds: TagEntityId[],
        cacheKey: string
    ) => {
        return (callback: () => void) =>
            this.addCounterUpdateCallback(
                entityType,
                entityIds,
                callback,
                cacheKey
            );
    };

    #updateTags = (tags: TagDataV2[]) => {
        let triggeredCallbacks: Set<() => void> = new Set();
        tags.forEach((tag) => {
            const tagType = this.#tagTypes.get(tag.type_id) ?? null;
            const tagsOnType = this.#tagsByType.get(tag.type_id) ?? new Set();
            tagsOnType.add(tag.tag_id);
            this.#tags.set(tag.tag_id, tag);

            if (tagType) {
                const tagsOnEntityType: Map<
                    string | number,
                    Set<string>
                > = this.#tagsByEntity.get(tagType.entity_type) ?? new Map();
                const tagsOnEntity =
                    tagsOnEntityType.get(tag.entity_id) ?? new Set();
                if (!tagsOnEntity.has(tag.tag_id)) {
                    tagsOnEntity.add(tag.tag_id);
                    this.#tagsByEntityCache
                        .get(tagType.entity_type)
                        ?.delete(tag.entity_id);
                }
                tagsOnEntityType.set(tag.entity_id, tagsOnEntity);
                this.#tagsByEntity.set(tagType.entity_type, tagsOnEntityType);
                let updateCallbacks = this.#tagListUpdateCallbacks
                    .get(tagType.entity_type)
                    ?.get(tag.entity_id);
                updateCallbacks = updateCallbacks.union(
                    this.#tagUpdateCallbacks.get(tag.tag_id) ?? new Set()
                );

                if (updateCallbacks) {
                    triggeredCallbacks =
                        triggeredCallbacks.union(updateCallbacks);
                }
            }
        });
        triggeredCallbacks.forEach((callback) => callback());
    };

    #removeTags = (tagIds: string[]) => {
        let triggeredCallbacks: Set<() => void> = new Set();
        const tags = tagIds
            .map((tagId) => this.#tags.get(tagId))
            .filter((tag) => tag && true);

        tags.forEach((tag) => {
            const tagType = this.#tagTypes.get(tag.type_id) ?? null;
            const tagsOnType = this.#tagsByType.get(tag.type_id) ?? new Set();
            tagsOnType.delete(tag.tag_id);
            this.#tags.delete(tag.tag_id);

            if (tagType) {
                const tagsOnEntityType: Map<
                    string | number,
                    Set<string>
                > = this.#tagsByEntity.get(tagType.entity_type) ?? new Map();
                const tagsOnEntity =
                    tagsOnEntityType.get(tag.entity_id) ?? new Set();
                if (tagsOnEntity.has(tag.tag_id)) {
                    tagsOnEntity.delete(tag.tag_id);
                    this.#tagsByEntityCache
                        .get(tagType.entity_type)
                        ?.delete(tag.entity_id);
                }
                if (tagsOnEntity.size === 0) {
                    tagsOnEntityType.delete(tag.entity_id);
                }
                let updateCallbacks = this.#tagListUpdateCallbacks
                    .get(tagType.entity_type)
                    ?.get(tag.entity_id);
                updateCallbacks = updateCallbacks.union(
                    this.#tagUpdateCallbacks.get(tag.tag_id) ?? new Set()
                );
                if (updateCallbacks) {
                    triggeredCallbacks =
                        triggeredCallbacks.union(updateCallbacks);
                }
            }
        });
        triggeredCallbacks.forEach((callback) => callback());
    };

    #readTagType = (tagTypeData: TagTypeV2Data, sourceId: string) => {
        if (this.#tagTypes.has(tagTypeData.type_id)) {
            throw new Error(
                `Duplicate tag type ${tagTypeData.type_id}, a duplicate tag type cannot be added.`
            );
        }
        const tagType = {
            ...tagTypeData,
            source_id: sourceId,
        };
        this.#tagTypes.set(tagTypeData.type_id, tagType);
        const variants = tagTypeData.variants ?? [];
        for (const variantDef of variants) {
            const [_, variance] = variantDef;
            const variant: TagTypeV2 = {
                ...tagTypeData,
                ...variance,
                type_id: computeVariantName(tagTypeData.type_id, variantDef),
                source_id: sourceId,
                user_managed: false,
            };

            delete variant.variants;
            Object.freeze(variant);

            this.#tagTypes.set(variant.type_id, variant);
        }
    };

    addSource = (source: TagSource) => {
        if (this.#tagSources.has(source.id)) {
            throw new Error(
                `Tag source re-added, source id: ${source.id}. Tag sources must be removed before adding again.`
            );
        }
        const tagTypes = source.getTypes();
        tagTypes.forEach((tagType) => this.#readTagType(tagType, source.id));

        const counters = source.getCounters();
        counters.forEach((counter) =>
            this.#tagCounters.set(counter.counter_id, counter)
        );

        const tags = source.getTags();
        this.#updateTags(tags);

        const updateCallback = ({
            updated,
            removed,
        }: {
            updated: TagDataV2[];
            removed: string[];
        }) => {
            if (updated) {
                this.#updateTags(updated);
            }
            if (removed) {
                this.#removeTags(removed);
            }
        };

        const cleanUpCall = source.addUpdateCallback(updateCallback);
        this.#sourceCleanUpCalls.set(source.id, cleanUpCall);
        // callbacks for type list listeners
        this.#tagTypeCache = null;
        this.#typeListUpdateCallbacks.forEach((callback) => callback());
    };

    removeSource = (source: TagSource) => {
        // remove tags from source
        const tags = source.getTags();
        const tagIds = tags.map((tag) => tag.tag_id);
        this.#removeTags(tagIds);
        // remove counters
        const counters = source.getCounters();
        counters.forEach((counter) =>
            this.#tagCounters.delete(counter.counter_id)
        );
        // remove types from source
        const newTagTypes = [...this.#tagTypes.entries()].filter(
            ([_typeId, tagType]) => tagType.source_id !== source.id
        );
        this.#tagTypes = new Map(newTagTypes);
        // clean up calls, remove source
        this.#sourceCleanUpCalls.get(source.id)?.();
        this.#sourceCleanUpCalls.delete(source.id);
        this.#tagSources.delete(source.id);
        // callbacks for type list listeners
        this.#tagTypeCache = null;
        this.#typeListUpdateCallbacks.forEach((callback) => callback());
    };
}

export { TagManager, TagEntityType };
export type {
    TagDataV2,
    TagTypeV2Data as TagTypeV2,
    TagSource,
    TagCounterResult,
    TagCounterV2,
};
