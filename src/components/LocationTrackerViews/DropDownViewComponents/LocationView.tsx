import React, { forwardRef, useContext } from "react";
import ServiceContext from "../../../contexts/serviceContext";
import Icon from "../../icons/icons";
import { textPrimary } from "../../../constants/colors";
import { TextButton } from "../../shared/buttons";
import { useLocationStatus } from "../../../hooks/sectionHooks";
import { useTagList } from "../../../hooks/tagHook";
import { TagEntityType } from "../../../services/tags/tagManager";
import { naturalSort } from "../../../utility/comparisons";
import { RowComponentProps } from "react-window";

const LocationView = forwardRef(
    (
        {
            locations,
            index,
            style,
            onLocationSelect,
            selectedLocation,
        }: RowComponentProps<{
            locations: string[];
            onLocationSelect?: (locationName: string) => void;
            selectedLocation?: string;
        }>,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const serviceContext = useContext(ServiceContext);
        const locationManager = serviceContext.locationManager;
        if (!locationManager) {
            throw new Error("No location manager provided");
        }
        const tagManager = serviceContext.tagManager;
        const location = locations[index];
        const status = useLocationStatus(locationManager, location);

        const tagStatus = { checked: status.checked, ignored: status.ignored };
        const tags = useTagList(tagManager, TagEntityType.location, status.id);
        const selected = selectedLocation === location;

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
                    position: "relative",
                    backgroundColor: selected
                        ? "rgba(128, 128, 128, 0.25)"
                        : "",
                    paddingLeft: "1em",
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
                        onClick={() => onLocationSelect?.(location)}
                    >
                        <Icon
                            fontSize="14px"
                            type={iconType}
                            style={{ color: iconColor }}
                            iconParams={iconSpec}
                        />{" "}
                        {status.displayName ?? location}
                    </TextButton>
                </span>
            </div>
        );
    }
);
LocationView.displayName = "LocationView";

export default LocationView;
