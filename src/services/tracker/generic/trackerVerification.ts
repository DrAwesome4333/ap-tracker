import { LocationManager } from "../../locations/locationManager";
import { GroupData } from "../../sections/groupManager";
import { SectionConfigData } from "../../sections/sectionManager";

/**
 * Performs validation checks on section and group data provided
 * @param sectionData
 * @param groupData
 * @param locationManager If not present, validation for check completeness will not be performed
 * @returns
 */
const verifyTrackerConfig = (
    sectionData: SectionConfigData,
    groupData: { [groupKey: string]: GroupData },
    locationManager?: LocationManager
) => {
    const errors = [];
    // Do verification
    const remainingChecks =
        locationManager?.getMatchingLocations(LocationManager.filters.exist) ??
        new Set();
    const remainingGroups = new Set(Object.getOwnPropertyNames(groupData));
    const allGroups = new Set(Object.getOwnPropertyNames(groupData));
    const remainingSections = new Set(
        Object.getOwnPropertyNames(sectionData.categories)
    );

    // verify all checks are covered, any left are in remaining checks
    remainingGroups.forEach((groupName) => {
        const { checks } = groupData[groupName];
        checks.forEach((check) => remainingChecks.delete(check));
    });

    // verify all groups are in at least one section
    remainingSections.forEach((sectionName) => {
        const { groupKey } = sectionData.categories[sectionName];
        if (groupKey && typeof groupKey === "string") {
            if (!allGroups.has(groupKey)) {
                errors.push(
                    `Group not found error: "${groupKey}" in category "${sectionName}"`
                );
            }
            remainingGroups.delete(groupKey);
        } else if (groupKey && Array.isArray(groupKey)) {
            groupKey.forEach((group) => {
                if (!allGroups.has(group)) {
                    errors.push(
                        `Group not found error: "${group}" in category "${sectionName}"`
                    );
                }
                remainingGroups.delete(group);
            });
        }
    });

    // Verify all sections are reachable
    const traverseCategoryTree = (name: string, parents: string[]) => {
        if (!name) {
            errors.push(
                `Name error: "${name}" was specified as a child category.\n\tReferenced by ${
                    parents.length > 0
                        ? parents[parents.length - 1]
                        : "<source code>"
                }`
            );
            return;
        }
        if (!sectionData.categories[name]) {
            errors.push(
                `Category not found error: "${name}".\n\tReferenced by ${
                    parents.length > 0
                        ? parents[parents.length - 1]
                        : "<source code>"
                }`
            );
            return;
        }
        if (parents.includes(name)) {
            errors.push(
                `Recursion error: "${name}" is an ancestor of itself.\n\tReferenced by ${
                    parents.length > 0
                        ? parents[parents.length - 1]
                        : "<source code>"
                }\n\tLineage: ${parents.join(" -> ")}`
            );
            return;
        }

        const section = sectionData.categories[name];
        if (section.children) {
            const lineage = [...parents];
            lineage.push(name);
            section.children.forEach((childName) =>
                traverseCategoryTree(childName, lineage)
            );
        }
        remainingSections.delete(name);
    };

    traverseCategoryTree("root", []);

    // Final verification steps
    if (remainingChecks.size > 0) {
        errors.unshift(
            `Not all checks in this game are covered by the tracker. Checks missing: ${[
                ...remainingChecks.values(),
            ].join(", ")}`
        );
    }
    if (remainingGroups.size > 0) {
        errors.unshift(
            `Not all groups in the tracker are used by a category. Groups not used: ${[
                ...remainingGroups.values(),
            ].join(", ")}`
        );
    }
    if (remainingSections.size > 0) {
        errors.unshift(
            `Not all sections are reached in the section tree. Unreachable sections: ${[
                ...remainingSections.values(),
            ].join(", ")}`
        );
    }

    return errors;
};

export { verifyTrackerConfig };
