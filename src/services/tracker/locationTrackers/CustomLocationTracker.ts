import { LocationManager } from "../../locations/locationManager";
import LocationReport from "./LocationReport";
import { convertLocationTrackerV1toV2 } from "./upgradePathV1V2";
import { LocationTrackerType, ResourceType } from "../resourceEnums";
import {
    DropdownLocationTracker,
    LocationTrackerManifest,
    Section,
} from "./locationTrackers";
import {
    CustomLocationTrackerDef_V2,
    SectionDef_V2,
} from "./formatDefinitions/CustomLocationTrackerFormat_V2";

class CustomLocationTracker implements DropdownLocationTracker {
    manifest: LocationTrackerManifest;
    type: LocationTrackerType.dropdown;
    locationManager: LocationManager;
    protected listeners: Set<() => void> = new Set();
    protected cleanupCalls: Set<() => void> = new Set();
    protected locations: Set<string> = new Set();
    protected sections: Map<string, Section> = new Map();
    protected errors: string[] = [];
    protected cachedErrors: string[] = [];
    #data: CustomLocationTrackerDef_V2;

    constructor(
        locationManager: LocationManager,
        data?: CustomLocationTrackerDef_V1 | CustomLocationTrackerDef_V2
    ) {
        this.locationManager = locationManager;
        if (data && "customTrackerVersion" in data) {
            if (data.customTrackerVersion === 1) {
                data = convertLocationTrackerV1toV2(data);
            } else {
                throw new Error(
                    `Custom Location Tracker Version ${data.customTrackerVersion} Not Supported`
                );
            }
        }
        if (data && "manifest" in data) {
            this.read(data);
        } else {
            this.manifest = {
                version: "0.0.0",
                locationTrackerType: LocationTrackerType.dropdown,
                uuid: null,
                type: ResourceType.locationTracker,
                formatVersion: 2,
                game: null,
                name: "Null Tracker",
            };
        }
    }

    protected read = (data: CustomLocationTrackerDef_V2) => {
        if (data.manifest.formatVersion !== 2) {
            throw new Error(
                `Unsupported custom tracker format version ${data.manifest.formatVersion}`
            );
        }
        this.manifest = data.manifest;
        this.#data = data;

        const groups = data.groups ?? {};
        const sections = data.sections;
        const themes = data.themes ?? { default: { color: "#888888" } };

        // Finds a section at the root of the section tree and  parses it.
        const parseSection_string = (
            sectionName: string,
            parents: string[] = []
        ) => {
            const sectionDef = sections[sectionName];
            // Section not found
            if (!sectionDef) {
                this.errors.push(
                    `Section ${sectionName} could not be found.\nPath:\n\t${[...parents, sectionName].join(" => \n\t")}`
                );
                return null;
            }

            return parseSection_v2Def(sectionDef, sectionName, parents);
        };

        const parseSection_v2Def = (
            sectionDef: SectionDef_V2,
            sectionName: string,
            parents: string[] = []
        ) => {
            // Section is a child of itself
            if (parents && parents.includes(sectionName)) {
                this.errors.push(
                    `Section "${sectionName}" is a descendent of itself.\nPath:\n\t${[...parents, sectionName].join(" => \n\t")}`
                );
                return null;
            }

            // Section already processed
            if (this.sections.has(sectionName)) {
                return this.sections.get(sectionName);
            }

            const groupNames =
                typeof sectionDef.groups === "string"
                    ? [sectionDef.groups]
                    : [...(sectionDef.groups ?? [])];
            for (const groupName of groupNames) {
                if (!groups[groupName]) {
                    this.errors.push(
                        `Group ${groupName} could not be found.\nPath:\n\t${[...parents, sectionName].join(" => \n\t")}`
                    );
                }
            }

            const section: Section = {
                title: sectionDef.title,
                id: sectionName,
                children: !Array.isArray(sectionDef.children)
                    ? [...Object.keys(sectionDef.children ?? {})]
                    : [...sectionDef.children],
                parents: [],
                locationReport: new LocationReport(),
                locations: [
                    ...groupNames
                        .map((groupName) => groups[groupName]?.locations ?? [])
                        .flat(),
                    ...(sectionDef.locations ?? []),
                ],
                theme: { color: "#888888", ...themes[sectionDef.theme] },
            };

            this.sections.set(sectionName, section);

            const childParents = [...parents, sectionName];
            const children = !sectionDef.children
                ? []
                : Array.isArray(sectionDef.children)
                  ? sectionDef.children.map((childName) =>
                        parseSection_string(childName, childParents)
                    )
                  : Object.entries(sectionDef.children).map(
                        ([childName, childDef]) =>
                            parseSection_v2Def(
                                childDef,
                                childName,
                                childParents
                            )
                    );
            children.forEach((child) => {
                if (child && !child.parents.includes(sectionName)) {
                    child.parents.push(sectionName);
                }
            });

            section.locations.forEach((value) => this.locations.add(value));
            const subscriber = this.locationManager.getSubscriberCallback(
                new Set(section.locations)
            );
            const cleanup = subscriber((_updatedLocations) => {
                this.updateSection(sectionName);
            });
            this.updateSection(sectionName);
            this.cleanupCalls.add(cleanup);

            return section;
        };

        parseSection_string("root");

        // extra validation
        const remainingGroups = new Set(Object.keys(groups));
        Object.entries(sections).forEach(([name, section]) => {
            if (!this.sections.has(name)) {
                this.errors.push(`Section ${name} can not be reached`);
            }
            const sectionGroups =
                typeof section.groups === "string"
                    ? [section.groups]
                    : [...(section.groups ?? [])];
            sectionGroups.forEach((name) => remainingGroups.delete(name));
        });
        remainingGroups.forEach((name) =>
            this.errors.push(`Group ${name} is unused.`)
        );

        [...this.sections.values()].forEach((section) => {
            Object.freeze(section);
            Object.freeze(section.locations);
            Object.freeze(section.parents);
            Object.freeze(section.children);
        });
        this.callListeners();
    };

    protected updateSection = (
        sectionName: string,
        processedSections: Set<string> = new Set(),
        callListeners = true
    ) => {
        if (processedSections.has(sectionName)) {
            return;
        }
        const section = this.sections.get(sectionName);
        const locationReport = new LocationReport();
        section.locations.forEach((location) => {
            locationReport.addLocation(this.locationManager, location);
        });
        section.children.forEach((childName) => {
            const child = this.sections.get(childName);
            if (child) {
                locationReport.addReport(child.locationReport);
            }
        });
        processedSections.add(sectionName);
        const newSection = {
            ...section,
        };
        newSection.locationReport = locationReport;

        Object.freeze(newSection);

        this.sections.set(sectionName, newSection);
        section.parents.forEach((parentName) =>
            this.updateSection(parentName, processedSections, false)
        );

        if (callListeners) {
            this.callListeners(sectionName);
        }
    };

    protected callListeners = (_sectionName?: string) => {
        this.listeners.forEach((listener) => listener());
    };

    getUpdateSubscriber = (_name?: string) => {
        return (listener: () => void) => {
            this.listeners.add(listener);
            return () => {
                this.listeners.delete(listener);
            };
        };
    };

    getSection = (name: string) => {
        return this.sections.get(name);
    };

    validateLocations = (locations?: Set<string>) => {
        const missingLocations = (
            locations ??
            this.locationManager.getMatchingLocations(
                LocationManager.filters.exist
            )
        ).difference(this.locations);
        if (missingLocations.size > 0) {
            this.errors.push(
                `The following locations are missing from the custom location tracker:\n\t${[...missingLocations.values()].join("\n\t")}`
            );
        }
    };

    getErrors = () => {
        if (this.cachedErrors.length !== this.errors.length) {
            this.cachedErrors = [...this.errors];
            Object.freeze(this.cachedErrors);
        }
        return this.cachedErrors;
    };

    exportDropdowns = (newUuid?: string) => {
        return this.#data
            ? {
                  ...this.#data,
                  manifest: {
                      ...this.#data.manifest,
                      uuid: newUuid ?? this.#data.manifest.uuid,
                  },
              }
            : null;
    };
}

export default CustomLocationTracker;
