import React, { forwardRef, useContext } from "react";
import ServiceContext from "../../../contexts/serviceContext";
import Icon from "../../icons/icons";
import { textPrimary } from "../../../constants/colors";
import { TextButton } from "../../shared/buttons";
import { useTagList } from "../../../hooks/tagHook";
import { TagEntityType } from "../../../services/tags/tagManager";
import { naturalSort } from "../../../utility/comparisons";
import { RowComponentProps } from "react-window";
import {
    LocationId,
    LocationStatus,
} from "../../../services/locations/locationSource";

const LocationView = forwardRef(
    (
        {
            locations,
            index,
            style,
            onLocationSelect,
            selectedLocation,
        }: RowComponentProps<{
            locations: LocationStatus[];
            onLocationSelect?: (locationId: LocationId) => void;
            selectedLocation?: LocationId;
        }>,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const serviceContext = useContext(ServiceContext);
        const tagManager = serviceContext.tagManager;
        const location = locations[index];

        const tagStatus = {
            checked: location.checked,
            ignored: location.ignored,
        };
        const tags = useTagList(
            tagManager,
            TagEntityType.location,
            location.locationId
        );
        const selected = selectedLocation === location.locationId;

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
        if (location.checked || location.ignored) {
            classes.add("checked");
            if (location.ignored) {
                classes.add("ignored");
            }
        }

        let iconType = location.checked
            ? "check_small"
            : "check_indeterminate_small";
        let iconColor = textPrimary;
        let iconSpec = {};

        if (displayedTagType) {
            iconType = displayedTagType.icon_id;
            iconColor = displayedTagType.icon_color ?? iconColor;
            iconSpec = displayedTagType.icon_spec;
        }

        return (
            <div
                ref={ref}
                style={{
                    backgroundColor: selected
                        ? "rgba(128, 128, 128, 0.25)"
                        : "",
                    paddingLeft: "1em",
                    boxSizing: "border-box",
                    ...style,
                }}
            >
                <span className={[...classes].join(" ")}>
                    <TextButton
                        style={{
                            textDecoration:
                                classes.has("checked") || classes.has("ignored")
                                    ? "line-through"
                                    : "",
                        }}
                        onClick={() => onLocationSelect?.(location.locationId)}
                    >
                        <Icon
                            fontSize="14px"
                            type={iconType}
                            style={{ color: iconColor }}
                            iconParams={iconSpec}
                        />{" "}
                        {location.name}
                    </TextButton>
                </span>
            </div>
        );
    }
);
LocationView.displayName = "LocationView";

export default LocationView;
