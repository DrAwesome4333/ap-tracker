import { useSyncExternalStore } from "react";
import { TagEntityType, TagId, TagManager } from "../services/tags/tagManager";
import emptySyncCallback from "./emptyCallback";
import { randomShortId } from "../utility/uuid";

const useTagCounters = (
    tagManager: TagManager,
    entityType: TagEntityType,
    entityIds: (string | number)[],
    entityStatuses: { [statusName: string]: boolean }[]
) => {
    const cacheKey = randomShortId();
    return useSyncExternalStore(
        tagManager?.getCounterUpdateCallbackHook(
            entityType,
            entityIds,
            cacheKey
        ) ?? emptySyncCallback,
        () =>
            tagManager?.getCounterResults(
                entityType,
                entityIds,
                entityStatuses,
                cacheKey
            ) ?? [],
        () =>
            tagManager?.getCounterResults(
                entityType,
                entityIds,
                entityStatuses,
                cacheKey
            ) ?? []
    );
};

const useTagList = (
    tagManager: TagManager,
    entityType: TagEntityType,
    entityId: string | number
) => {
    return useSyncExternalStore(
        tagManager?.getTagListUpdateCallbackHook(entityType, entityId) ??
            emptySyncCallback,
        () => tagManager?.getTagIdsOnEntity(entityType, entityId),
        () => tagManager?.getTagIdsOnEntity(entityType, entityId)
    );
};

const useTagTypeList = (tagManager: TagManager) => {
    return useSyncExternalStore(
        tagManager?.getTypeListUpdateCallbackHook() ?? emptySyncCallback,
        () => tagManager?.getTypeList(),
        () => tagManager?.getTypeList()
    );
};

const useTag = (tagManager: TagManager, tagId: TagId) => {
    return useSyncExternalStore(
        tagManager?.getTagUpdateCallbackHook(tagId) ?? emptySyncCallback,
        () => tagManager?.getTagById(tagId),
        () => tagManager?.getTagById(tagId)
    );
};

export { useTagList, useTag, useTagTypeList, useTagCounters };
