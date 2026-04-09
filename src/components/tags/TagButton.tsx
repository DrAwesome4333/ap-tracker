import React, { useContext } from "react";
import { TagEntityType } from "../../services/tags/tagManager";
import { useTagList } from "../../hooks/tagHook";
import Icon, { IconParams } from "../icons/icons";
import { TextButton } from "../shared/buttons";
import { primary } from "../../constants/colors";
import SlotContext from "../../contexts/slotContext";

const TagButton = ({
    entityType,
    entityId,
    typeId,
    tagClick,
}: {
    entityType: TagEntityType;
    entityId: string | number;
    typeId: string;
    tagClick: (typeId: string) => void;
}) => {
    const slotContext = useContext(SlotContext);
    const tagManager = slotContext.tagManager;
    const tagList = useTagList(tagManager, entityType, entityId);
    const tagOnEntity =
        tagList.filter(
            (tagId) => tagManager?.getTagById(tagId)?.type_id === typeId
        ).length > 0;
    const tagType = tagManager?.getTagType(typeId);
    const iconStyle: IconParams = {
        fill: tagOnEntity ? 1 : 0,
        grade: tagOnEntity ? 200 : -25,
        ...tagType?.icon_spec,
    };

    return (
        <TextButton
            onClick={(e) => {
                e.stopPropagation();
                tagClick(typeId);
            }}
        >
            <Icon
                style={{
                    color: tagType?.icon_color ?? primary,
                    transition: "all 0.12s ease-in",
                }}
                iconParams={iconStyle}
                type={tagType?.icon_id ?? "fmd_bad"}
            />
        </TextButton>
    );
};

export default TagButton;
