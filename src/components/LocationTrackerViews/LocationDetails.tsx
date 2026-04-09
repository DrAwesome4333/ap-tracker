import React, { useContext, useRef } from "react";
import { useTagList } from "../../hooks/tagHook";
import { TagEntityType, TagId } from "../../services/tags/tagManager";
import { useLocationStatus } from "../../hooks/sectionHooks";
import { naturalSort } from "../../utility/comparisons";
import LocationTagView from "./DropDownViewComponents/LocationTagView";
import TagBar from "../tags/TagBar";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { GhostButton } from "../shared/buttons";
import { LocationId } from "../../services/locations/locationSource";
import SlotContext from "../../contexts/slotContext";

const LocationDetails = ({
    locationId,
    onClose,
}: {
    locationId: LocationId;
    onClose: () => void;
}) => {
    const slotContext = useContext(SlotContext);
    const lastTagAdded = useRef<TagId>(null);
    const locationTagger = slotContext.locationTagger;
    const tagManager = slotContext.tagManager;
    const locationStatus = useLocationStatus(locationId);
    const tags = useTagList(tagManager, TagEntityType.location, locationId);
    const tagStatus = {
        checked: locationStatus?.checked,
        ignored: locationStatus?.ignored,
    };

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

    const title = locationStatus?.name;

    return (
        <div
            style={{
                padding: "1em",
                boxSizing: "border-box",
                overflow: "auto",
                height: "100%",
                boxShadow: "3px 4px 0px rgba(0, 0, 0, 0.5)",
                border: "1px solid black",
            }}
        >
            {title}
            <br />
            <TagBar
                entityType={TagEntityType.location}
                entityId={locationId}
                tagClick={(typeId) => {
                    lastTagAdded.current = locationTagger.addTag(
                        typeId,
                        locationId
                    );
                }}
            />
            {sortedTags.map((tag) => (
                <LocationTagView
                    key={tag}
                    tagId={tag}
                    locationStatus={locationStatus}
                    onClear={(tagId) => locationTagger.removeTag(tagId)}
                    onText={(tagId, text) =>
                        locationTagger.updateTag(tagId, text)
                    }
                    shouldFocus={(id) => {
                        const result = lastTagAdded.current === id;
                        lastTagAdded.current = null;
                        return result;
                    }}
                />
            ))}
            <ButtonRow>
                <GhostButton onClick={onClose}>Close</GhostButton>
            </ButtonRow>
        </div>
    );
};

export default LocationDetails;
