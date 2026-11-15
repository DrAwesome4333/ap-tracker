import { useContext, useRef } from "react";
import { useTagList } from "@/hooks/tagHook";
import { useLocationStatus } from "@/hooks/sectionHooks";
import { TagEntityType, TagId } from "@/services/tags/tagManager";
import { LocationId } from "@/services/locations/locationSource";
import SlotContext from "@/contexts/slotContext";
import { naturalSort } from "@/utility/comparisons";
import TagBar from "@/components/tags/TagBar";
import ButtonRow from "@/components//LayoutUtilities/ButtonRow";
import { GhostButton } from "@/components/shared/buttons";
import LocationTagView from "./DropDownViewComponents/LocationTagView";
import styles from "./LocationTracker.module.css";

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
        <div className={styles.location_details}>
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
