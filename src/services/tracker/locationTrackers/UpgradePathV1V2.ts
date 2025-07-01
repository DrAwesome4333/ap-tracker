import { randomUUID } from "../../../utility/uuid";
import { ResourceType, LocationTrackerType } from "../resourceEnums";
const convertLocationTrackerV1toV2 = (
    locationTrackerDef: CustomLocationTrackerDef_V1
): CustomLocationTrackerDef_V2 => {
    const locationTrackerV2: CustomLocationTrackerDef_V2 = {
        manifest: {
            type: ResourceType.locationTracker,
            locationTrackerType: LocationTrackerType.dropdown,
            game: locationTrackerDef.game,
            name: locationTrackerDef.name,
            uuid: locationTrackerDef.id ?? randomUUID(),
            version: "0.0.0",
            formatVersion: 2,
        },
        themes: locationTrackerDef.sectionData.themes ?? {
            default: { color: "#888888" },
        },
        groups: {},
        sections: {},
    };

    for (const [groupName, group] of Object.entries(
        locationTrackerDef.groupData
    )) {
        locationTrackerV2.groups[groupName] = {
            locations: group.checks,
        };
    }

    for (const [sectionName, section] of Object.entries(
        locationTrackerDef.sectionData.categories
    )) {
        locationTrackerV2.sections[sectionName] = {
            title: section.title,
            groups:
                typeof section.groupKey === "string"
                    ? [section.groupKey]
                    : [...section.groupKey],
            children: section.children,
            theme: section.theme,
        };
    }

    return locationTrackerV2;
};

export { convertLocationTrackerV1toV2 };
