import React, { forwardRef, Fragment, useContext, useState } from "react";
import ServiceContext from "../../../contexts/serviceContext";
import Icon from "../../icons/icons";
import { tertiary, textPrimary } from "../../../constants/colors";
import { TextButton } from "../../buttons";
import { useLocationStatus } from "../../../hooks/sectionHooks";
import TagBar from "../../tags/TagBar";
import { useTagList } from "../../../hooks/tagHook";
import { TagEntityType } from "../../../services/tags/tagManager";
import { naturalSort } from "../../../utility/comparisons";
import LocationTagView from "./LocationTagView";

const LocationView = forwardRef(
    (
        { location }: { location: string },
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const [showDetails, setShowDetails] = useState(false);
        const serviceContext = useContext(ServiceContext);
        const locationManager = serviceContext.locationManager;
        if (!locationManager) {
            throw new Error("No location manager provided");
        }
        const tagManager = serviceContext.tagManager;
        const locationTagger = serviceContext.locationTagger;
        const status = useLocationStatus(locationManager, location);

        const tagStatus = { checked: status.checked, ignored: status.ignored };
        const tags = useTagList(tagManager, TagEntityType.location, status.id);

        const sortedTags = [...(tags ?? [])];
        sortedTags.sort((a, b) => {
            const tagA = tagManager.getTagById(a);
            const tagB = tagManager.getTagById(b);
            const tagAType = tagManager.getTagType(tagA.type_id, tagStatus);
            const tagBType = tagManager.getTagType(tagB.type_id, tagStatus);
            let comparisonValue = tagBType.priority - tagAType.priority;
            if (comparisonValue === 0) {
                comparisonValue = naturalSort(
                    tagAType.display_name,
                    tagBType.display_name
                );
            }

            return comparisonValue;
        });

        const displayedTag = sortedTags[0]
            ? tagManager.getTagById(sortedTags[0])
            : null;
        const displayedTagType = displayedTag
            ? tagManager.getTagType(displayedTag.type_id, tagStatus)
            : null;

        const classes = new Set(["section_check"]);
        if (status.checked || status.ignored) {
            classes.add("checked");
            if (status.ignored) {
                classes.add("ignored");
            }
        }

        let iconType = status.checked
            ? "check_small"
            : "check_indeterminate_small";
        let iconColor = textPrimary;

        if (displayedTagType) {
            iconType = displayedTagType.icon_id;
            iconColor = displayedTagType.icon_color ?? iconColor;
        }

        return (
            <div
                ref={ref}
                style={{
                    position: "relative",
                    backgroundColor: showDetails
                        ? "rgba(128, 128, 128, 0.25)"
                        : "",
                    padding: "0.5em",
                }}
                onFocus={() => setShowDetails(true)}
                onBlur={(e) => {
                    if (
                        !e.relatedTarget ||
                        !e.currentTarget.contains(e.relatedTarget)
                    ) {
                        setShowDetails(false);
                    }
                }}
            >
                <span
                    className={[...classes].join(" ")}
                    // onClick={() => {
                    //     setShowDetails(!showDetails);
                    // }}
                >
                    <TextButton
                        style={{
                            textDecoration:
                                classes.has("checked") || classes.has("ignored")
                                    ? "line-through"
                                    : "",
                        }}
                    >
                        <Icon
                            fontSize="14px"
                            type={iconType}
                            style={{ color: iconColor }}
                        />{" "}
                        {status.displayName ?? location}
                    </TextButton>
                    {showDetails && (
                        <TagBar
                            entityType={TagEntityType.location}
                            entityId={status.id}
                            toggleTag={(typeId) => {
                                const existingTags = locationTagger.queryTags(
                                    typeId,
                                    status.id
                                );
                                if (existingTags.length === 0) {
                                    locationTagger.addTag(typeId, status.id);
                                } else {
                                    existingTags.forEach((tag) =>
                                        locationTagger.removeTag(tag.tag_id)
                                    );
                                }
                            }}
                        />
                    )}
                </span>
                {showDetails && (
                    <>
                        {status.displayName && (
                            <div
                                style={{ marginLeft: "1em", color: tertiary }}
                            >{`Server Name: ${location}`}</div>
                        )}
                        {sortedTags.map((tag) => (
                            <LocationTagView
                                key={tag}
                                tagId={tag}
                                locationStatus={status}
                            />
                        ))}
                    </>
                )}
            </div>
        );
    }
);
LocationView.displayName = "LocationView";

export default LocationView;
