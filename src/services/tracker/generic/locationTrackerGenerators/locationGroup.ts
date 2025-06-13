import { GroupData } from "../../../sections/groupManager";
import { SectionConfigData } from "../../../sections/sectionManager";
import { naturalSort } from "../../../../utility/comparisons";

const GROUP_DEBUG = false;
const DEBUG_PARENT_GROUP_ORGANIZATION = GROUP_DEBUG;
const DEBUG_GROUP_CLASSIFICATION = GROUP_DEBUG;

const generateCategories = (groups: { [s: string]: string[] }) => {
    const unclassifiedLocations = new Set(groups["Everywhere"]);
    if (GROUP_DEBUG) {
        console.log("Location groups provided:", groups);
    }
    const groupConfig: { [s: string]: GroupData } = {};

    const categoryConfig: SectionConfigData = {
        categories: {
            root: {
                title: "Total",
                groupKey: null,
                theme: "default",
                children: [],
            },
        },
        options: {},
        themes: {
            default: { color: "#888888" },
            theme1: { color: "#FF0000" },
            theme2: { color: "#00AA00" },
            theme3: { color: "#0000FF" },
            theme4: { color: "#AAAA00" },
            theme5: { color: "#FF00FF" },
            theme6: { color: "#0000FF" },
        },
    };

    const themeNames = [
        "theme1",
        "theme2",
        "theme3",
        "theme4",
        "theme5",
        "theme6",
    ];

    const checkMembership: Map<string, Set<string>> = new Map();
    const groupSets: Map<string, Set<string>> = new Map();

    for (const groupName of Object.getOwnPropertyNames(groups)) {
        if (groupName === "Everywhere") {
            continue;
        }
        groupSets.set(groupName, new Set(groups[groupName]));
        const checks = groups[groupName];
        checks.forEach((check) => {
            unclassifiedLocations.delete(check);
            const membership = checkMembership.get(check) ?? new Set();
            membership.add(groupName);
            checkMembership.set(check, membership);
        });
    }

    const keyLocationGroups: Set<string> = new Set();
    const possibleParentGroups: Map<string, Set<string>> = new Map();
    const possibleChildGroups: Map<string, Set<string>> = new Map();
    /** Contains all groups that a group intersects with partially, but is not a subset or superset of */
    const groupOverlappingSets: Map<string, Set<string>> = new Map();
    const possibleMetaLocationGroups: Set<string> = new Set();

    // Go through all groups and determine how they relate to one another
    for (const [groupName, group] of groupSets.entries()) {
        const parentGroups: Set<string> = new Set();
        const childGroups: Set<string> = new Set();
        let overlappingGroups: Set<string> = new Set();
        for (const [otherGroupName, otherGroup] of groupSets.entries()) {
            if (otherGroupName === groupName) {
                continue;
            }
            if (group.isSubsetOf(otherGroup)) {
                // if both groups are equivalent, pick one to be the parent
                if (group.size === otherGroup.size) {
                    if (
                        groupName.length > otherGroupName.length ||
                        (groupName.length === otherGroupName.length &&
                            groupName > otherGroupName)
                    ) {
                        parentGroups.add(otherGroupName);
                    }
                } else {
                    parentGroups.add(otherGroupName);
                }
            }
            if (group.isSupersetOf(otherGroup)) {
                // if both groups are equivalent, pick one to be the child
                if (group.size === otherGroup.size) {
                    if (
                        groupName.length < otherGroupName.length ||
                        (groupName.length === otherGroupName.length &&
                            groupName < otherGroupName)
                    ) {
                        childGroups.add(otherGroupName);
                    }
                } else {
                    childGroups.add(otherGroupName);
                }
            }
            if (group.intersection(otherGroup).size > 0) {
                overlappingGroups.add(otherGroupName);
            }
        }
        overlappingGroups = overlappingGroups
            .difference(childGroups)
            .difference(parentGroups);
        let isKeyGroup = false;
        for (const check of group) {
            const membership = checkMembership.get(check) ?? new Set();
            if (
                membership.difference(parentGroups).difference(childGroups)
                    .size === 1
            ) {
                // does the check membership only contain this group, then this group must be a key group
                isKeyGroup = true;
                break;
            }
        }

        if (isKeyGroup) {
            if (DEBUG_GROUP_CLASSIFICATION) {
                console.log(`${groupName} may be a key group`);
            }
            keyLocationGroups.add(groupName);
        } else {
            if (DEBUG_GROUP_CLASSIFICATION) {
                console.log(`${groupName} may be a meta group`);
            }
            possibleMetaLocationGroups.add(groupName);
        }

        possibleParentGroups.set(groupName, parentGroups);
        possibleChildGroups.set(groupName, childGroups);
        groupOverlappingSets.set(groupName, overlappingGroups);
    }

    const metaLocationGroups: Set<string> = new Set();
    // Resolve edge cases where a key group may be completely made up of meta groups
    for (const groupName of possibleMetaLocationGroups) {
        // A meta group must also be a part of one key group in which it is not a complete subset of
        let isMeta = false;
        for (const otherGroupName of groupOverlappingSets.get(groupName) ??
            new Set()) {
            if (keyLocationGroups.has(otherGroupName)) {
                isMeta = true;
                break;
            }
        }
        if (isMeta) {
            metaLocationGroups.add(groupName);
            continue;
        }
    }
    possibleMetaLocationGroups
        .difference(metaLocationGroups)
        .forEach((groupName) => {
            keyLocationGroups.add(groupName);
            if (DEBUG_GROUP_CLASSIFICATION) {
                console.log(`${groupName} was converted to a key group`);
            }
        });

    // Resolve edge cases where a meta group may be identified as a key group if it contains a key group that is a complete subset of itself
    // This is done by computing overlaps with other groups and classifying the groups with the most conflicts as meta
    // A conflict between 2 groups cannot be solved easily, so we will not try to resolve those conflicts
    const computeKeyGroupConflicts = () => {
        /** @type {Map<string, Set<string>>} */
        const conflictGroups: Map<string, Set<string>> = new Map();
        for (const groupName of [...keyLocationGroups.values()]) {
            /** @type {Set<string>} */
            const localConflicts: Set<string> = new Set();
            for (const otherGroupName of keyLocationGroups) {
                if (groupOverlappingSets.get(groupName)?.has(otherGroupName)) {
                    localConflicts.add(otherGroupName);
                }
            }
            if (localConflicts.size > 0) {
                conflictGroups.set(groupName, localConflicts);
            }
        }
        const result = [...conflictGroups.entries()];
        result.sort(([_1, a], [_2, b]) => b.size - a.size);
        return result;
    };

    let orderedConflicts = computeKeyGroupConflicts();
    if (DEBUG_GROUP_CLASSIFICATION) {
        console.log("Conflicts", orderedConflicts);
    }
    while (orderedConflicts.length > 0) {
        const [groupName, conflicts] = orderedConflicts[0];
        if (conflicts.size <= 1) {
            if (DEBUG_GROUP_CLASSIFICATION) {
                console.log("Skipping remaining conflicts");
            }
            break;
        }

        keyLocationGroups.delete(groupName);
        metaLocationGroups.add(groupName);
        if (DEBUG_GROUP_CLASSIFICATION) {
            console.log(`Determined ${groupName} was not a key group`);
        }
        orderedConflicts = computeKeyGroupConflicts();
        if (DEBUG_GROUP_CLASSIFICATION) {
            console.log("Remaining Conflicts", orderedConflicts);
        }
    }

    if (DEBUG_GROUP_CLASSIFICATION) {
        console.log("Classification Results:");
        console.log("Key Location Groups:", keyLocationGroups);
        console.log("Meta Location Groups:", metaLocationGroups);
    }

    // resolve parent/child relationships for key groups
    const finalGroups: Map<string, Set<string>> = new Map();
    groupSets.forEach((value, key) => finalGroups.set(key, value));
    const locationGroupToFinalGroups: Map<string, Set<string>> = new Map();
    groupSets.forEach((_value, key) =>
        locationGroupToFinalGroups.set(key, new Set([key]))
    );

    const childTable: Map<string, Set<string>> = new Map();
    const roots: Set<string> = new Set();
    for (const groupName of keyLocationGroups) {
        const possibleParents = (
            possibleParentGroups.get(groupName) ?? new Set()
        ).difference(metaLocationGroups);
        if (possibleParents.size === 0) {
            roots.add(groupName);
            if (DEBUG_PARENT_GROUP_ORGANIZATION) {
                console.log(`Added ${groupName} to root`);
            }
        } else {
            const parents = [...possibleParents.values()];
            // sort the list ascending order
            parents.sort(
                (a, b) => groupSets.get(a)?.size - groupSets.get(b)?.size
            );
            const parent = parents[0];
            const siblings = childTable.get(parent) ?? new Set();
            siblings.add(groupName);
            childTable.set(parent, siblings);
            // remove checks from parent
            finalGroups.set(
                parent,
                finalGroups.get(parent).difference(finalGroups.get(groupName))
            );
            if (DEBUG_PARENT_GROUP_ORGANIZATION) {
                console.log(`Added ${groupName} as a child of ${parent}`);
            }
        }
    }

    if (DEBUG_PARENT_GROUP_ORGANIZATION) {
        console.log("Parenting results: ", childTable);
    }

    // same for meta groups for now, will make it better later
    if (metaLocationGroups.size > 0) {
        for (const groupName of metaLocationGroups) {
            const possibleParents = (
                possibleParentGroups.get(groupName) ?? new Set()
            ).difference(keyLocationGroups);
            if (possibleParents.size === 0) {
                roots.add(groupName);
                if (DEBUG_PARENT_GROUP_ORGANIZATION) {
                    console.log(`Added ${groupName} to root`);
                }
            } else {
                const parents = [...possibleParents.values()];
                // sort the list ascending order
                parents.sort(
                    (a, b) => groupSets.get(a)?.size - groupSets.get(b)?.size
                );
                const parent = parents[0];
                const siblings = childTable.get(parent) ?? new Set();
                siblings.add(groupName);
                childTable.set(parent, siblings);
                // remove checks from parent
                finalGroups.set(
                    parent,
                    finalGroups
                        .get(parent)
                        .difference(finalGroups.get(groupName))
                );
                if (DEBUG_PARENT_GROUP_ORGANIZATION) {
                    console.log(`Added ${groupName} as a child of ${parent}`);
                }
            }
        }
    }

    // build group tree
    for (const [groupName, checks] of finalGroups.entries()) {
        groupConfig[`group_${groupName}`] = {
            checks: [...checks.values()],
        };
    }

    // build category tree
    const getChildList = (parentName: string) => {
        const children = childTable.get(parentName) ?? new Set();
        const childList = [];
        children.forEach((childName) => {
            const allNames = locationGroupToFinalGroups.get(childName);
            allNames.forEach((x) => childList.push(x));
        });
        return childList;
    };

    // place nodes in tree
    let themeCounter = 0;
    for (const groupName of keyLocationGroups.union(metaLocationGroups)) {
        categoryConfig.categories[`section_${groupName}`] = {
            title: groupName,
            theme: keyLocationGroups.has(groupName)
                ? themeNames[themeCounter++ % themeNames.length]
                : "default",
            children: getChildList(groupName).map((name) => `section_${name}`),
            groupKey: `group_${groupName}`,
        };
        if (roots.has(groupName)) {
            categoryConfig.categories.root.children.push(
                `section_${groupName}`
            );
        }
    }

    // sort the root
    categoryConfig.categories.root.children.sort((a: string, b: string) => {
        const aIsKey = keyLocationGroups.has(a.slice("section_".length));
        const bIsKey = keyLocationGroups.has(b.slice("section_".length));
        if (aIsKey === bIsKey) {
            return naturalSort(a, b);
        } else if (aIsKey) {
            return -1;
        }
        return 1;
    });

    if (unclassifiedLocations.size > 0) {
        groupConfig["group_unclassified"] = {
            checks: [...unclassifiedLocations.values()],
        };
        categoryConfig.categories["section_unclassified"] = {
            title: "Unclassified Checks",
            groupKey: "group_unclassified",
            theme: "default",
            children: null,
        };
        categoryConfig.categories.root.children.push("section_unclassified");
    } else {
        delete categoryConfig.categories["section_unclassified"];
    }

    return {
        groupConfig,
        categoryConfig,
    };
};

const LocationGroupCategoryGenerator = {
    generateCategories,
};

export default LocationGroupCategoryGenerator;
