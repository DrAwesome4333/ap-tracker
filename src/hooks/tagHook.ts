import { useEffect, useMemo, useRef, useState } from "react";
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
    const counters = useMemo(() => {
        if (!tagManager) {
            return [];
        }

        const _counters: Map<string, TagCounterResult> = new Map();
        entityIds.forEach((entityId, index) => {
            const tagsOnEntity = tags[entityId];
            tagsOnEntity?.forEach((tagId) => {
                const tag = tagManager.getTagById(tagId);
                const tagType = tagManager.getTagType(
                    tag?.type_id,
                    entityStatuses[index]
                );
                if (
                    tagType.counter_id &&
                    typeof tagType.counter_id === "string"
                ) {
                    tagManager.evaluateCounter(
                        tagType.counter_id,
                        entityStatuses[index],
                        _counters
                    );
                } else if (
                    tagType.counter_id &&
                    Array.isArray(tagType.counter_id)
                ) {
                    tagType.counter_id.forEach((counter_id) =>
                        tagManager.evaluateCounter(
                            counter_id,
                            entityStatuses[index],
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
    entityIds.forEach((id) => {
        if (!tags[id]) {
            setTags((old) => ({
                ...old,
                [id]: tagManager?.getTagIdsOnEntity(entityType, id) ?? [],
            }));
        }
    });
    useEffect(() => {
        const callbacks = entityIds.map((entityId) => ({
            entityId,
            callback: () =>
                setTags((old) => ({
                    ...old,
                    [entityId]:
                        tagManager?.getTagIdsOnEntity(entityType, entityId) ??
                        [],
                })),
        }));
        const cleanupCalls = callbacks.map((x) =>
            tagManager?.addTagListUpdateCallback(
                entityType,
                x.entityId,
                x.callback
            )
        );
        return () => {
            cleanupCalls.forEach((cleanup) => cleanup?.());
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

    useEffect(() => {
        const callback = () => {
            setTags(tagManager?.getTagIdsOnEntity(entityType, entityId) ?? []);
        };
        callback();
        const cleanup = tagManager?.addTagListUpdateCallback(
            entityType,
            entityId,
            callback
        );
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
