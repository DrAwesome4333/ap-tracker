import { useEffect, useRef, useState } from "react";
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
    // TODO, check if effect is needed, as entity statuses will
    // also update, potentially triggering a double update
    const [counters, setCounters] = useState<TagCounterResult[]>([]);
    const cacheVersionRef = useRef<Symbol>(null);
    const cacheRef = useRef<TagCounterResult[]>(null);
    // TODO fix

    useEffect(() => {
        const callback = () => {
            if (cacheVersionRef.current !== tagManager?.cacheVersion) {
                cacheRef.current = tagManager?.getCounterResults(
                    entityType,
                    entityIds,
                    entityStatuses
                );
                cacheVersionRef.current = tagManager?.cacheVersion;
                console.log("Cache update");
            }
            setCounters(cacheRef.current ?? []);
        };
        console.log("Effect update");
        callback();

        const cleanup = tagManager?.addCounterUpdateCallback(
            entityType,
            entityIds,
            callback
        );
        return () => {
            cleanup?.();
        };
    }, [tagManager, entityType, entityIds]);
    return counters;
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
        console.log("tag list effect");
        console.log(tagManager);
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
