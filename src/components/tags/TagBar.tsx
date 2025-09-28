import React, { useContext } from "react";
import { TagEntityType } from "../../services/tags/tagManager";
import { useTagTypeList } from "../../hooks/tagHook";
import ServiceContext from "../../contexts/serviceContext";
import TagButton from "./TagButton";
import { background } from "../../constants/colors";

const TagBar = ({
    entityType,
    entityId,
    toggleTag,
}: {
    entityType: TagEntityType;
    entityId: string | number;
    toggleTag: (typeId: string) => void;
}) => {
    const services = useContext(ServiceContext);
    const tagManager = services.tagManager;
    const allTagTypes = useTagTypeList(tagManager);
    const tagOptions = allTagTypes.filter(
        (tagType) => tagType.entity_type === entityType && tagType.user_managed
    );
    return (
        <div
            style={{
                position: "absolute",
                top: "0",
                right: "0",
                boxShadow: "2px 3px 5px rgba(0, 0, 0, 0.5)",
                backgroundColor: background,
                borderRadius: "0.25em",
                padding: "0.25em",
                margin: "0.25em",
            }}
        >
            {tagOptions.map((option) => (
                <TagButton
                    key={option.type_id}
                    entityId={entityId}
                    entityType={entityType}
                    toggleTag={toggleTag}
                    typeId={option.type_id}
                />
            ))}
        </div>
    );
};

export default TagBar;
