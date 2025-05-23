import { LocationManager, LocationStatus } from "../locations/locationManager";
import { EntranceManager } from "../entrances/entranceManager";
import { CounterMode } from "../tags/tagManager";
import { GroupManager } from "./groupManager";

class LocationReport {
    existing: Set<string> = new Set();
    checked: Set<string> = new Set();
    ignored: Set<string> = new Set();
    tagCounts: Map<string, Set<string>> = new Map();
    tagTotals: Map<string, Set<string>> = new Map();

    /**
     * Adds report values from the provided report to this report;
     * @param report The report to read from
     */
    addReport = (report: LocationReport) => {
        this.existing = this.existing.union(report.existing);
        this.checked = this.checked.union(report.checked);
        this.ignored = this.ignored.union(report.ignored);
        report.tagCounts.forEach((counter, counterName) => {
            const updatedCounter: Set<string> = counter.union(
                this.tagCounts.get(counterName) ?? new Set()
            );
            this.tagCounts.set(counterName, updatedCounter);
        });
        report.tagTotals.forEach((counter, counterName) => {
            const updatedCounter: Set<string> = counter.union(
                this.tagTotals.get(counterName) ?? new Set()
            );
            this.tagTotals.set(counterName, updatedCounter);
        });
        return this;
    };

    /**
     * Adds the status of a check to the report
     * @param locationManager
     * @param locationName
     * @returns
     */
    addLocation = (locationManager: LocationManager, locationName: string) => {
        const status = locationManager.getLocationStatus(locationName);
        if (!status.exists) {
            return status;
        }
        // add to correct lists
        this.existing.add(locationName);
        if (status.checked) {
            this.checked.add(locationName);
        } else if (status.ignored) {
            this.ignored.add(locationName);
        }

        // add to tag counters
        status.tags.forEach((tag) => {
            const counter = tag.counter;
            if (!counter) {
                return;
            }
            const counterTotal = this.tagTotals.get(counter.id) ?? new Set();
            const counterCount = this.tagCounts.get(counter.id) ?? new Set();
            counterTotal.add(locationName);

            switch (counter.countMode) {
                case CounterMode.countChecked: {
                    if (status.checked || status.ignored) {
                        counterCount.add(locationName);
                    }
                    break;
                }

                case CounterMode.countUnchecked: {
                    if (!status.checked && !status.ignored) {
                        counterCount.add(locationName);
                    }
                    break;
                }
                default: {
                    counterCount.add(locationName);
                    break;
                }
            }
            this.tagTotals.set(counter.id, counterTotal);
            this.tagCounts.set(counter.id, counterCount);
        });
        return status;
    };
}

const defaultTheme = {
    color: "black",
};

const defaultSectionStatus: Section = {
    title: "No Title",
    checks: new Map(),
    checkReport: new LocationReport(),
    theme: defaultTheme,
    children: null,
};

const sectionDefaults = {
    title: "Untitled Section",
    groupKey: null,
    type: null,
    theme: "default",
    children: null,
};

const themeDefaults = {
    color: "black",
};

interface SectionDef {
    title: string;
    type?: null;
    groupKey?: string | null;
    theme: string;
    children: string[] | null;
}

interface SectionConfig {
    title: string;
    groupKey: string | string[] | null;
    theme: SectionTheme;
    children: string[] | null;
}

interface SectionConfigData {
    categories: { [categoryKey: string]: SectionDef };
    options: unknown;
    themes: { [themeKey: string]: SectionThemeDef };
}

interface Section {
    title: string;
    checkReport: LocationReport;
    checks: Map<string, LocationStatus>;
    portals?: unknown;
    theme: SectionTheme;
    children: string[] | null;
}

interface SectionUpdate {
    title?: string;
    checkReport?: LocationReport;
    checks?: Map<string, LocationStatus>;
    portals?: unknown;
    theme?: SectionTheme;
    children?: string[] | null;
}

interface SectionThemeDef {
    color: string;
}

interface SectionTheme {
    color: string;
}

interface SectionUpdateTreeNode {
    sectionName: string;
    checks: Set<string>;
    checkReport: LocationReport;
    shouldFlatten: boolean;
    children: Set<SectionUpdateTreeNode>;
    parents: Set<SectionUpdateTreeNode>;
    remove: () => void;
    update: () => void;
}

interface SectionManager {
    updateSectionStatus: (sectionName: string, section: SectionUpdate) => void;
    setConfiguration: (configData: SectionConfigData) => void;
    deleteAllSections: () => void;
    deleteSection: (sectionName: string) => void;
    getSectionStatus: (sectionName: string) => Section | null;
    getSubscriberCallback: (
        sectionName: string
    ) => (listener: () => void) => () => void;
}

const createSectionManager = (
    locationManager: LocationManager,
    _entranceManager: EntranceManager,
    groupManager: GroupManager
): SectionManager => {
    const sectionData: Map<string, Section> = new Map();
    const sectionConfigData: Map<string, SectionConfig> = new Map();
    const sectionSubscribers: Map<string, Set<() => void>> = new Map();
    let updateTreeRoot: SectionUpdateTreeNode | null = null;
    const groups = groupManager.groups;

    const deleteSection = (sectionName: string) => {
        sectionData.delete(sectionName);
        sectionSubscribers.get(sectionName)?.forEach((listener) => listener());
    };

    const deleteAllSections = () => {
        const names = [...sectionData.keys()];
        names.map((name) => deleteSection(name));
    };

    const updateSectionStatus = (
        sectionName: string,
        section: SectionUpdate
    ) => {
        sectionData.set(sectionName, {
            ...(sectionData.get(sectionName) ?? defaultSectionStatus),
            ...section,
        });
        sectionSubscribers.get(sectionName)?.forEach((listener) => listener());
    };

    const getSubscriberCallback = (sectionName: string) => {
        return (listener: () => void) => {
            if (!sectionSubscribers.has(sectionName)) {
                sectionSubscribers.set(sectionName, new Set());
            }
            sectionSubscribers.get(sectionName)?.add(listener);
            // return a function to clean up the subscription
            return () => {
                sectionSubscribers.get(sectionName)?.delete(listener);
                if (!sectionSubscribers.get(sectionName)?.size) {
                    sectionSubscribers.delete(sectionName);
                }
            };
        };
    };

    const getSectionStatus = (sectionName: string) =>
        sectionData.get(sectionName) ?? null;
    // Builds a tree from the section config data that can be compiled into hard categories with options and state
    const readSectionConfig = (configData: SectionConfigData) => {
        const sectionThemes: Map<string, SectionTheme> = new Map();

        /**
         * Doesn't do much at the moment, reads types into section types
         * @param name
         * @param theme
         */
        const readTheme = (name: string, theme: SectionThemeDef) => {
            const fullTheme = {
                ...themeDefaults,
                ...theme,
            };
            sectionThemes.set(name, fullTheme);
        };

        /**
         * Assemble the categories
         * @param categoryName
         * @param parents
         */
        const readCategory = (
            categoryName: string,
            parents: Set<string> = new Set()
        ) => {
            if (parents.has(categoryName)) {
                console.warn(
                    `Circular dependency detected, ${categoryName} had a descendant that was itself. Parents: \n${[
                        ...parents.values(),
                    ].join("\n")}`
                );
                return null;
            }
            if (!configData.categories[categoryName]) {
                console.warn(`Failed to find category ${categoryName}`);
                return null;
            }
            const category: SectionDef = {
                ...sectionDefaults,
                ...configData.categories[categoryName],
            };
            const result: SectionConfig = {
                title: category.title,
                children: [],
                groupKey: category.groupKey,
                theme: defaultTheme,
            };

            if (category.theme) {
                const theme = sectionThemes.get(category.theme);
                if (!theme) {
                    console.warn(
                        `Failed to find theme ${category.theme} for ${category.title}, using default theme`
                    );
                } else {
                    result.theme = theme;
                }
            }

            if (category.children) {
                const parentage = new Set(parents);
                parentage.add(categoryName);
                for (const childName of category.children) {
                    readCategory(childName, parentage);
                    result.children?.push(childName);
                }
            }
            sectionConfigData.set(categoryName, result);
            return result;
        };

        if (configData.themes) {
            for (const themeName of Object.keys(configData.themes)) {
                readTheme(themeName, configData.themes[themeName]);
            }
        } else {
            console.warn("No 'themes' property found in configuration data");
        }

        readCategory("root");
    };

    const buildSectionUpdateTree = () => {
        /**
         *
         * @param {string} sectionName
         * @param {SectionUpdateTreeNode[]} parents
         * @param {Set<string>} lineage
         * @returns
         */
        const buildSectionUpdateTreeNode = (
            sectionName: string,
            parents: SectionUpdateTreeNode[] = [],
            lineage: Set<string> = new Set()
        ) => {
            if (lineage.has(sectionName)) {
                return null;
            }
            const sectionConfig = sectionConfigData.get(sectionName);

            if (!sectionConfig) {
                console.warn(
                    `Failed to find a configuration for "${sectionName}. Lineage: \n\t${[
                        ...lineage.values(),
                    ].join("\n\t")}`
                );
                return null;
            }

            const listenerCleanUpCalls: Set<() => void> = new Set();

            const cleanUpListeners = () => {
                listenerCleanUpCalls.forEach((cleanUpCall) => cleanUpCall());
            };

            const buildLocationReport = () => {
                const locationReport = new LocationReport();
                const locations: Map<string, LocationStatus> = new Map();
                node.checks.forEach((location) =>
                    locations.set(
                        location,
                        locationReport.addLocation(locationManager, location)
                    )
                );
                node.children.forEach((child) =>
                    locationReport.addReport(child.checkReport)
                );
                return { locationReport, locations };
            };

            const update = () => {
                let checkValues;
                ({ locationReport: node.checkReport, locations: checkValues } =
                    buildLocationReport());
                parents.forEach((parent) => parent.update());
                updateSectionStatus(sectionName, {
                    checkReport: node.checkReport,
                    checks: checkValues,
                    children: [...node.children].map(
                        (child) => child.sectionName
                    ),
                });
            };

            const remove = () => {
                cleanUpListeners();
                node.parents.forEach((parent) => {
                    parent.children.delete(node);
                    parent.update();
                });
                const children = [...node.children.values()];
                children.forEach((child) => {
                    child.parents.delete(node);
                    if (child.parents.size === 0) {
                        child.remove();
                    }
                });
            };

            const node: SectionUpdateTreeNode = {
                sectionName,
                checks: new Set(),
                checkReport: new LocationReport(),
                children: new Set(),
                parents: new Set(parents),
                shouldFlatten: false,
                remove,
                update,
            };

            let checkGroups = [];
            if (typeof sectionConfig.groupKey == "string") {
                checkGroups.push(sectionConfig.groupKey);
            } else if (sectionConfig.groupKey) {
                checkGroups = sectionConfig.groupKey;
            }

            // Build a list of checks for the area
            for (const groupName of checkGroups) {
                const checks: string[] = [
                    ...(groups.get(groupName)?.checks.values() ?? []),
                ];
                checks.forEach((check) => node.checks.add(check));
            }

            // set up listeners on checks

            const subscribe = locationManager.getSubscriberCallback(
                new Set(node.checks)
            );
            const cleanUpCall = subscribe(update);
            listenerCleanUpCalls.add(cleanUpCall);

            // create children
            const childLineage = new Set([...lineage.values(), sectionName]);
            sectionConfig.children?.forEach((childName) => {
                const child = buildSectionUpdateTreeNode(
                    childName,
                    [node],
                    childLineage
                );
                if (child) {
                    node.children.add(child);
                }
            });

            updateSectionStatus(sectionName, {
                title: sectionConfig.title,
                theme: sectionConfig.theme,
                children: [...node.children].map((child) => child.sectionName),
            });
            node.update();
            return node;
        };

        return buildSectionUpdateTreeNode("root");
    };

    const setConfiguration = (rawSectionConfigData: SectionConfigData) => {
        deleteAllSections();
        updateTreeRoot?.remove();
        readSectionConfig(rawSectionConfigData);
        updateTreeRoot = buildSectionUpdateTree();
    };

    const SectionManager = {
        updateSectionStatus,
        deleteAllSections,
        deleteSection,
        getSectionStatus,
        getSubscriberCallback,
        setConfiguration,
    };

    return SectionManager;
};

export { createSectionManager };
export type {
    Section,
    SectionConfigData,
    SectionManager,
    SectionTheme,
    SectionThemeDef,
};
