import { IconParams } from "../../components/icons/icons";
import { naturalSort } from "../../utility/comparisons";
import LocationRepository from "../locations/locationRepository";
import {
    LocationSource,
    LocationUpdateCallback,
} from "../locations/locationSource";

/** A list of properties that must be true on the entities status for a tag */
type TagCondition = string[];
type TagEntityId = number | string;
type TagId = number;
interface TagCounterV2 {
    /** id for the counter */
    counter_id: string;
    /** Display name for the counter */
    display_name: string;
    /** What color to display the counter icon */
    color: string;
    /** Which icon to use for the counter */
    icon_id: string;
    /** Tweak the appearance of icons */
    icon_spec?: IconParams;
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
    icon_spec: IconParams;
    count: number;
    total?: number;
};

type TagVariantDef = [string[], TagVariantType];

interface TagDataV2 {
    type_id: string;
    tag_id: TagId;
    entity_id: number | string;
    data?: string | number;
}

interface TagTypeV2Data {
    display_name: string;
    type_id: string;
    icon_id: string;
    icon_spec?: IconParams;
    entity_type: TagEntityType;
    icon_color?: string;
    text_color?: string;
    priority?: number;
    variants?: TagVariantDef[];
    effects?: { [effect_name: string]: unknown };
    counter_id?: string;
    user_managed?: boolean;
    allows_text?: boolean;
}

interface TagTypeV2 {
    display_name: string;
    type_id: string;
    icon_id: string;
    icon_spec: IconParams;
    source_id: string;
    entity_type: TagEntityType;
    icon_color?: string;
    text_color?: string;
    priority?: number;
    variants?: TagVariantDef[];
    effects?: { [effect_name: string]: unknown };
    counter_id?: string | string[];
    user_managed?: boolean;
    allows_text?: boolean;
}

interface TagVariantType {
    icon_color?: string;
    icon_id?: string;
    text_color?: string;
    counter_id?: string;
}

interface TagSource {
    id: string;
    getTags: (tags?: TagId[]) => TagDataV2[];
    getTypes: () => TagTypeV2Data[];
    getCounters: () => TagCounterV2[];
    /** Subscribes provided callback to all updates to tags in this source, returns a clean up call */
    addUpdateCallback: (
        callback: (tagChanges: {
            updated?: TagDataV2[];
            removed?: TagId[];
        }) => void
    ) => () => void;
}

enum TagEntityType {
    location = "location",
}

const computeVariantName = (tagTypeId: string, variant: TagVariantDef) => {
    return `__${tagTypeId}_${variant[0].join("_")}`;
};

class TagManager implements LocationSource {
    #tagSources: Map<string, TagSource> = new Map();
    #sourceCleanUpCalls: Map<string, () => void> = new Map();
    #tagTypes: Map<string, TagTypeV2> = new Map();
    #tagTypeCache: TagTypeV2[] = null;
    #tags: Map<TagId, TagDataV2> = new Map();
    #tagsByEntity: Map<TagEntityType, Map<TagEntityId, Set<TagId>>> = new Map();
    #tagsByEntityCache: Map<TagEntityType, Map<TagEntityId, TagId[]>> =
        new Map();
    #tagsByType: Map<string, Set<TagId>> = new Map();
    #tagListUpdateCallbacks: Map<
        TagEntityType,
        Map<TagEntityId, Set<() => void>>
    > = new Map();
    #tagUpdateCallbacks: Map<TagId, Set<() => void>> = new Map();
    #typeListUpdateCallbacks: Set<() => void> = new Set();
    #tagCounters: Map<string, TagCounterV2> = new Map();
    #tagCounterResultCache: Map<string, TagCounterResult[]> = new Map();
    #locationRepository: LocationRepository;
    #locationUpdateCallback: LocationUpdateCallback;

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
        if (!counter) {
            return false;
        }
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
            icon_spec: counter.icon_spec ?? {},
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
            Set<TagId>
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
        if (tagType?.variants && status) {
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

    getTagById = (tagId: TagId) => {
        return this.#tags.get(tagId) ?? null;
    };

    getTagIdsOnEntity = (
        entityType: TagEntityType,
        entityId: string | number
    ) => {
        let cache = this.#tagsByEntityCache.get(entityType)?.get(entityId);
        if (!cache) {
            const entityTypeCache: Map<string | number, TagId[]> =
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

    addTagUpdateCallback = (tagId: TagId, callback: () => void) => {
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

    getTagUpdateCallbackHook = (tagId: TagId) => {
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
        const affectedLocations: Set<number> = new Set();
        tags.forEach((tag) => {
            const tagType = this.#tagTypes.get(tag.type_id) ?? null;
            const tagsOnType = this.#tagsByType.get(tag.type_id) ?? new Set();
            tagsOnType.add(tag.tag_id);
            this.#tags.set(tag.tag_id, tag);

            if (tagType) {
                const tagsOnEntityType: Map<
                    string | number,
                    Set<number>
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
                let updateCallbacks =
                    this.#tagListUpdateCallbacks
                        .get(tagType.entity_type)
                        ?.get(tag.entity_id) ?? new Set();
                updateCallbacks = updateCallbacks.union(
                    this.#tagUpdateCallbacks.get(tag.tag_id) ?? new Set()
                );

                if (updateCallbacks) {
                    triggeredCallbacks =
                        triggeredCallbacks.union(updateCallbacks);
                }
                if (tagType.entity_type === TagEntityType.location) {
                    affectedLocations.add(tag.entity_id as number);
                }
            }
        });
        triggeredCallbacks.forEach((callback) => callback());
        this.#applyLocationEffects([...affectedLocations]);
    };

    #removeTags = (tagIds: TagId[]) => {
        let triggeredCallbacks: Set<() => void> = new Set();
        const tags = tagIds
            .map((tagId) => this.#tags.get(tagId))
            .filter((tag) => tag && true);
        const affectedLocations: Set<number> = new Set();
        tags.forEach((tag) => {
            const tagType = this.#tagTypes.get(tag.type_id) ?? null;
            const tagsOnType = this.#tagsByType.get(tag.type_id) ?? new Set();
            tagsOnType.delete(tag.tag_id);
            this.#tags.delete(tag.tag_id);

            if (tagType) {
                const tagsOnEntityType: Map<
                    string | number,
                    Set<TagId>
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
                let updateCallbacks =
                    this.#tagListUpdateCallbacks
                        .get(tagType.entity_type)
                        ?.get(tag.entity_id) ?? new Set();

                updateCallbacks = updateCallbacks.union(
                    this.#tagUpdateCallbacks.get(tag.tag_id) ?? new Set()
                );
                if (updateCallbacks) {
                    triggeredCallbacks =
                        triggeredCallbacks.union(updateCallbacks);
                }
                if (tagType.entity_type === TagEntityType.location) {
                    affectedLocations.add(tag.entity_id as number);
                }
            }
        });
        triggeredCallbacks.forEach((callback) => callback());
        this.#applyLocationEffects([...affectedLocations]);
    };

    #readTagType = (tagTypeData: TagTypeV2Data, sourceId: string) => {
        if (this.#tagTypes.has(tagTypeData.type_id)) {
            throw new Error(
                `Duplicate tag type ${tagTypeData.type_id}, a duplicate tag type cannot be added.`
            );
        }
        const tagType: TagTypeV2 = {
            ...tagTypeData,
            source_id: sourceId,
            icon_spec: tagTypeData.icon_spec ?? {},
        };
        this.#tagTypes.set(tagTypeData.type_id, tagType);
        const variants = tagTypeData.variants ?? [];
        Object.freeze(tagType);
        for (const variantDef of variants) {
            const [_, variance] = variantDef;
            const variant: TagTypeV2 = {
                ...tagTypeData,
                ...variance,
                type_id: computeVariantName(tagTypeData.type_id, variantDef),
                source_id: sourceId,
                user_managed: false,
                icon_spec: tagTypeData.icon_spec ?? {},
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
            removed: TagId[];
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

    enableLocationEffects = (locationRepository: LocationRepository) => {
        this.#locationRepository = locationRepository;
        locationRepository.addSource(this);
        this.#applyLocationEffects(
            [...(this.#tagsByEntity.get(TagEntityType.location) ?? [])].map(
                ([locationId, _tags]) => locationId as number
            )
        );
    };

    locationUpdateHook = (callback: LocationUpdateCallback) => {
        this.#locationUpdateCallback = callback;
        return () => {
            if (this.#locationUpdateCallback === callback) {
                this.#locationUpdateCallback = null;
            }
        };
    };

    #applyLocationEffects = (locationIds: number[]) => {
        if (!this.#locationRepository) {
            return;
        }

        const effects: {
            locationId: number;
            checked?: boolean;
            ignored?: boolean;
        }[] = locationIds
            .map((id) => ({
                locationId: id,
                tags: this.#tagsByEntity.get(TagEntityType.location)?.get(id),
            })) // get tags on location
            .filter((x) => x.tags && x.tags.size > 0) // only use locations with found tags
            .map(
                (
                    location // map to relevant types
                ) =>
                    [...location.tags]
                        .map((tagId) =>
                            this.#tagTypes.get(this.#tags.get(tagId).type_id)
                        )
                        .reduce(
                            (prev, curr) => ({
                                ...prev,
                                ...(curr.effects ?? {}),
                            }),
                            { locationId: location.locationId }
                        )
            )
            .filter(
                (location) =>
                    Object.hasOwn(location, "checked") ||
                    Object.hasOwn(location, "ignored")
            );

        this.#locationUpdateCallback?.(effects);
    };
}

export { TagManager, TagEntityType };
export type {
    TagDataV2,
    TagTypeV2Data as TagTypeV2,
    TagSource,
    TagCounterResult,
    TagCounterV2,
    TagVariantDef,
    TagId,
};
