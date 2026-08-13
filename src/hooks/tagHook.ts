import { useEffect, useMemo, useEffectEvent, useState } from "react";
import {
    TagCounterResult,
    TagDataV2,
    TagEntityType,
    TagId,
    TagManager,
    TagTypeV2,
} from "../services/tags/tagManager";

const useTagCounters = (
    tagManager: TagManager,
    entityType: TagEntityType,
    entityIds: (string | number)[],
    entityStatuses: { [statusName: string]: boolean }[]
) => {
    const tags = useTagLists(tagManager, entityType, entityIds);
    const tagTypes = useTagTypeList(tagManager);
    const reverseIndexLookup = useMemo(() => {
        const result: Record<string | number, number> = {};
        entityIds.forEach((id, index) => (result[id] = index));
        return result;
    }, [entityIds]);

    const counters = useMemo(() => {
        if (!tagManager) {
            return [];
        }

        const _counters: Map<string, TagCounterResult> = new Map();
        Object.entries(tags).forEach(([entityId, tags]) => {
            if (!tags || tags.length === 0) {
                return;
            }
            const index = reverseIndexLookup[entityId];
            const entityStatus = entityStatuses[index];
            tags.forEach((tagId) => {
                const tag = tagManager.getTagById(tagId);
                const tagType = tagManager.getTagType(
                    tag?.type_id,
                    entityStatus
                );
                if (
                    tagType.counter_id &&
                    typeof tagType.counter_id === "string"
                ) {
                    tagManager.evaluateCounter(
                        tagType.counter_id,
                        entityStatus,
                        _counters
                    );
                } else if (
                    tagType.counter_id &&
                    Array.isArray(tagType.counter_id)
                ) {
                    tagType.counter_id.forEach((counter_id) =>
                        tagManager.evaluateCounter(
                            counter_id,
                            entityStatus,
                            _counters
                        )
                    );
                }
            });
        });
        return [..._counters.values()];
    }, [tagManager, entityType, entityIds, tags, tagTypes, entityStatuses]);

    return counters;
};

const useTagLists = (
    tagManager: TagManager,
    entityType: TagEntityType,
    entityIds: (string | number)[]
) => {
    const [tags, setTags] = useState<Record<number | string, TagId[]>>({});
    const updateTagList = useEffectEvent(() => {
        const newTags: Record<number | string, TagId[]> = {};
        let hasNewTags = false;
        entityIds.forEach((id) => {
            if (!tags[id]) {
                newTags[id] =
                    tagManager?.getTagIdsOnEntity(entityType, id) ?? [];
                hasNewTags = true;
            } else {
                const tagsInManager =
                    tagManager?.getTagIdsOnEntity(entityType, id) ?? [];
                const currentTags = tags[id];

                // Check if there are changes between tag lists
                if (
                    tagsInManager.length !== currentTags.length ||
                    tagsInManager.some((tagId) => !currentTags.includes(tagId))
                ) {
                    hasNewTags = true;
                    newTags[id] = tagsInManager;
                }
            }
        });
        if (hasNewTags) {
            setTags((oldTags) => ({ ...oldTags, ...newTags }));
        }
    });
    useEffect(() => {
        const cleanupCall = tagManager?.addTagListUpdateCallback(
            entityType,
            entityIds,
            updateTagList
        );
        updateTagList();
        return () => {
            cleanupCall?.();
        };
    }, [tagManager, entityType, entityIds]);
    return tags;
};

const useTagList = (
    tagManager: TagManager,
    entityType: TagEntityType,
    entityId: string | number
) => {
    const [tags, setTags] = useState<TagId[]>([]);
    const updateTagList = useEffectEvent(() => {
        const tagsInManager =
            tagManager?.getTagIdsOnEntity(entityType, entityId) ?? [];
        // Check if there are changes between tag lists to prevent un-needed re-renders
        if (
            tagsInManager.length !== tags.length ||
            tagsInManager.some((tagId) => !tags.includes(tagId))
        ) {
            setTags(tagsInManager);
        }
    });
    useEffect(() => {
        const cleanup = tagManager?.addTagListUpdateCallback(
            entityType,
            entityId,
            updateTagList
        );
        updateTagList();
        return () => {
            cleanup?.();
        };
    }, [tagManager, entityType, entityId]);

    return tags;
};

const useTagTypeList = (tagManager: TagManager) => {
    const [tagTypes, setTagTypes] = useState<TagTypeV2[]>(
        tagManager?.getTypeList() ?? []
    );

    useEffect(() => {
        const callback = () => {
            console.log("Tag list callback");
            setTagTypes(tagManager?.getTypeList() ?? []);
        };

        const cleanup = tagManager?.addTypeListUpdateCallback(callback);
        return () => {
            cleanup?.();
        };
    }, [tagManager]);
    return tagTypes;
};

const useTag = (tagManager: TagManager, tagId: TagId) => {
    const [tag, setTag] = useState<TagDataV2>(null);

    useEffect(() => {
        const callback = () => {
            setTag(tagManager?.getTagById(tagId));
        };
        callback();
        const cleanup = tagManager?.addTagUpdateCallback(tagId, callback);
        return () => {
            cleanup?.();
        };
    }, [tagManager, tagId]);

    return tag;
};

export { useTagList, useTag, useTagTypeList, useTagCounters };
