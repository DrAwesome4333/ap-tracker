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
import { GamePackageWrapper } from "../../gamepackage/GamePackageWrapper";
import { LocationId } from "../../locations/locationSource";

class CustomLocationTracker implements DropdownLocationTracker {
    manifest: LocationTrackerManifest;
    type: LocationTrackerType.dropdown;
    optionOverrides?: {
        locationOrder?: "natural" | "id" | "lexical" | "listed";
    } = {};
    protected listeners: Set<() => void> = new Set();
    protected cleanupCalls: Set<() => void> = new Set();
    protected locations: Set<number> = new Set();
    protected sections: Map<string, Section> = new Map();
    protected errors: string[] = [];
    protected cachedErrors: string[] = [];
    protected gamePackage: GamePackageWrapper;

    #data: CustomLocationTrackerDef_V2;

    constructor(
        gamePackage?: GamePackageWrapper,
        data?: CustomLocationTrackerDef_V1 | CustomLocationTrackerDef_V2
    ) {
        this.gamePackage = gamePackage;
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
        this.optionOverrides = data.optionOverrides ?? {};

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
            let trackedLocations: Set<LocationId> = new Set();
            children.forEach((child) => {
                trackedLocations = trackedLocations.union(
                    new Set(child.trackedLocations)
                );
            });

            const section: Section = {
                title: sectionDef.title,
                id: sectionName,
                children: !Array.isArray(sectionDef.children)
                    ? [...Object.keys(sectionDef.children ?? {})]
                    : [...sectionDef.children],
                locations: [
                    ...groupNames
                        .map((groupName) => groups[groupName]?.locations ?? [])
                        .flat()
                        .map((x) => this.gamePackage.getLocationId(x)),
                    ...(sectionDef.locations?.map((x) =>
                        this.gamePackage.getLocationId(x)
                    ) ?? []),
                ],
                trackedLocations: [],
                theme: { color: "#888888", ...themes[sectionDef.theme] },
            };

            trackedLocations = trackedLocations.union(
                new Set(section.locations)
            );
            section.trackedLocations = [...trackedLocations];
            this.sections.set(sectionName, section);
            this.updateSection(sectionName);

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
            Object.freeze(section.children);
        });
        this.locations = new Set(this.sections.get("root")?.trackedLocations);
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

        processedSections.add(sectionName);
        const newSection = {
            ...section,
        };

        Object.freeze(newSection);

        this.sections.set(sectionName, newSection);

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
            locations ?? new Set(this.gamePackage.getAllLocationNames())
        ).difference(
            new Set(
                [...this.locations.values()].map((id) =>
                    this.gamePackage.getLocationName(id)
                )
            )
        );
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
