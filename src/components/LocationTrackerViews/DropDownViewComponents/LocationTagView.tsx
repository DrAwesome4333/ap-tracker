import { useContext, useEffect, useRef, useState } from "react";
import { useTag } from "../../../hooks/tagHook";
import { textPrimary } from "../../../constants/colors";
import Icon from "../../icons/icons";
import { LocationStatus } from "../../../services/locations/locationSource";
import { Input } from "../../inputs";
import {
    DangerButton,
    PrimaryButton,
    SecondaryButton,
} from "../../shared/buttons";
import { TagId } from "../../../services/tags/tagManager";
import SlotContext from "../../../contexts/slotContext";

const LocationTagView = ({
    tagId,
    locationStatus,
    onClear,
    onText,
    shouldFocus,
}: {
    tagId: TagId;
    locationStatus: LocationStatus;
    onClear: (tagId: TagId) => void;
    onText: (tagId: TagId, text: string) => void;
    shouldFocus: (tagId: TagId) => boolean;
}) => {
    const slot = useContext(SlotContext);
    const tagManager = slot.tagManager;
    const tag = useTag(tagManager, tagId);
    const tagType = tagManager?.getTagType(tag?.type_id, {
        checked: locationStatus?.checked,
        ignored: locationStatus?.ignored,
    });
    const inputRef = useRef<HTMLInputElement>(null);

    const storedText = tag?.data ?? tagType?.display_name ?? "";
    const [textField, setTextField] = useState("");
    const [editMode, setEditMode] = useState(false);
    const canClear = tagType?.user_managed && true;
    const canEdit = tagType?.allows_text && true;

    useEffect(() => {
        if (editMode) {
            inputRef.current?.focus();
        }
    }, [editMode]);

    useEffect(() => {
        if (shouldFocus?.(tagId)) {
            setEditMode(true);
        }
    }, []);
    return (
        <div
            style={{
                marginLeft: "1rem",
                color: tagType?.text_color ?? textPrimary,
                textDecoration: "none",
                // display: "inline-block",
            }}
        >
            <Icon
                fontSize="14px"
                type={tagType?.icon_id ?? "fmd_bad"}
                style={{
                    color: tagType?.icon_color ?? textPrimary,
                }}
                iconParams={tagType?.icon_spec}
            />{" "}
            {editMode ? (
                <Input
                    ref={inputRef}
                    type="text"
                    value={textField}
                    onChange={(e) => setTextField(e.target.value)}
                    onKeyUp={(e) => {
                        if (e.key === "Enter") {
                            onText(tagId, textField);
                            setEditMode(false);
                        }
                        if (e.key === "Escape") {
                            setTextField(storedText.toString());
                            setEditMode(false);
                        }
                    }}
                />
            ) : (
                storedText
            )}
            {editMode ? (
                <>
                    <PrimaryButton
                        tiny
                        style={{
                            margin: "1em",
                        }}
                        onClick={() => {
                            onText(tagId, textField);
                            setEditMode(false);
                        }}
                    >
                        {" "}
                        <Icon type="check_small" fontSize="14px" />{" "}
                    </PrimaryButton>
                    <SecondaryButton
                        tiny
                        style={{
                            margin: "1em",
                        }}
                        onClick={() => {
                            setEditMode(false);
                            setTextField(storedText.toString());
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
                    tiny
                    onClick={() => {
                        setEditMode(true);
                        setTextField(storedText.toString());
                    }}
                >
                    {" "}
                    <Icon type="edit" fontSize="14px" />{" "}
                </PrimaryButton>
            ) : (
                <></>
            )}
            {canClear && !editMode && (
                <DangerButton
                    style={{
                        margin: "1em",
                    }}
                    onClick={() => onClear(tagId)}
                    tiny
                >
                    <Icon fontSize="14px" type="delete" />
                </DangerButton>
            )}
        </div>
    );
};

export default LocationTagView;
