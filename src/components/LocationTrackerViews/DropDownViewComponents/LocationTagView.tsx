import React, { useContext, useState } from "react";
import ServiceContext from "../../../contexts/serviceContext";
import { useTag } from "../../../hooks/tagHook";
import { textPrimary } from "../../../constants/colors";
import Icon from "../../icons/icons";
import { LocationStatus } from "../../../services/locations/locationManager";
import { Input } from "../../inputs";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../buttons";
import { TagId } from "../../../services/tags/tagManager";

const LocationTagView = ({
    tagId,
    locationStatus,
    onClear,
    onText,
}: {
    tagId: TagId;
    locationStatus: LocationStatus;
    onClear: (tagId: TagId) => void;
    onText: (tagId: TagId, text: string) => void;
}) => {
    const services = useContext(ServiceContext);
    const tagManager = services.tagManager;
    const tag = useTag(tagManager, tagId);
    const tagType = tagManager.getTagType(tag.type_id, {
        checked: locationStatus.checked,
        ignored: locationStatus.ignored,
    });

    const [text, setText] = useState(tag.data ?? tagType.display_name);
    const [editMode, setEditMode] = useState(false);
    const canClear = tagType.user_managed && true;
    const canEdit = tagType.allows_text && true;

    return (
        <div
            style={{
                marginLeft: "1rem",
                color: tagType.text_color ?? textPrimary,
                textDecoration: "none",
                // display: "inline-block",
            }}
        >
            <Icon
                fontSize="14px"
                type={tagType.icon_id}
                style={{
                    color: tagType.icon_color ?? textPrimary,
                }}
                iconParams={tagType.icon_spec}
            />{" "}
            {editMode ? (
                <Input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            ) : (
                text
            )}
            {editMode ? (
                <>
                    <PrimaryButton
                        $tiny
                        style={{
                            margin: "1em",
                        }}
                        onClick={() => {
                            onText(tagId, text.toString());
                            setEditMode(false);
                        }}
                    >
                        {" "}
                        <Icon type="check_small" fontSize="14px" />{" "}
                    </PrimaryButton>
                    <SecondaryButton
                        $tiny
                        style={{
                            margin: "1em",
                        }}
                        onClick={() => {
                            setEditMode(false);
                            setText(tag.data ?? tagType.display_name);
                        }}
                    >
                        {" "}
                        <Icon type="close_small" fontSize="14px" />{" "}
                    </SecondaryButton>
                </>
            ) : canEdit ? (
                <PrimaryButton
                    style={{
                        margin: "1em",
                    }}
                    $tiny
                    onClick={() => setEditMode(true)}
                >
                    {" "}
                    <Icon type="edit" fontSize="14px" />{" "}
                </PrimaryButton>
            ) : (
                <></>
            )}
            {canClear && (
                <DangerButton
                    style={{
                        margin: "1em",
                    }}
                    onClick={() => onClear(tagId)}
                    $tiny
                >
                    <Icon fontSize="14px" type="delete" />
                </DangerButton>
            )}
        </div>
    );
};

export default LocationTagView;
