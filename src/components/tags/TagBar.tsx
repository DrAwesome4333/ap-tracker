import React, { useContext } from "react";
import { TagEntityType } from "../../services/tags/tagManager";
import { useTagTypeList } from "../../hooks/tagHook";
import TagButton from "./TagButton";
import { background } from "../../constants/colors";
import SlotContext from "../../contexts/slotContext";

const TagBar = ({
    entityType,
    entityId,
    tagClick,
}: {
    entityType: TagEntityType;
    entityId: string | number;
    tagClick: (typeId: string) => void;
}) => {
    const slotContext = useContext(SlotContext);
    const tagManager = slotContext.tagManager;
    const allTagTypes = useTagTypeList(tagManager);
    const tagOptions = allTagTypes.filter(
        (tagType) => tagType.entity_type === entityType && tagType.user_managed
    );
    return (
        <div
            style={{
                boxShadow: "2px 3px 5px rgba(0, 0, 0, 0.5)",
                backgroundColor: background,
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
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
                    tagClick={tagClick}
                    typeId={option.type_id}
                />
            ))}
        </div>
    );
};

export default TagBar;
