import { LocationManager } from "../../locations/locationManager";
import LocationReport from "./LocationReport";
import { convertLocationTrackerV1toV2 } from "./upgradePathV1V2";
import { LocationTrackerType } from "../resourceEnums";

class CustomLocationTracker implements DropdownLocationTracker {
    manifest: LocationTrackerManifest;
    type: LocationTrackerType.dropdown;
    locationManager: LocationManager;
    #listeners: Set<() => void> = new Set();
    #cleanupCalls: Set<() => void> = new Set();
    #locations: Set<string> = new Set();
    #sections: Map<string, Section> = new Map();
    #errors: string[] = [];
    #cachedErrors: string[] = [];

    constructor(data: CustomLocationTrackerDef_V1 | CustomLocationTrackerDef_V2, locationManager: LocationManager, repositoryUUID: string) {
        this.locationManager = locationManager;
        if ("customTrackerVersion" in data) {
            if (data.customTrackerVersion === 1) {
                data = convertLocationTrackerV1toV2(data);
            } else {
                throw new Error(`Custom Location Tracker Version ${data.customTrackerVersion} Not Supported`)
            }

        }
        this.#read(data);
        this.manifest.repositoryUuid = repositoryUUID;
    }


    #read = (data: CustomLocationTrackerDef_V2) => {
        this.manifest = data.manifest;

        const groups = data.groups ?? {};
        const sections = data.sections;
        const themes = data.themes ?? { default: { color: "#888888" } };

        // Finds a section at the root of the section tree and  parses it. 
        const parseSection_string = (sectionName: string, parents?: string[]) => {
            const sectionDef = sections[sectionName];
            // Section not found
            if (!sectionDef) {
                this.#errors.push(`Section ${sectionName} could not be found.\nPath:\n\t${[...parents, sectionName].join("\t => \n")}`);
                return null;
            }

            return parseSection_v2Def(sectionDef, sectionName, parents);
        }

        const parseSection_v2Def = (sectionDef: SectionDef_V2, sectionName: string, parents?: string[]) => {
            // Section is a child of itself
            if (parents && parents.includes(sectionName)) {
                this.#errors.push(`Section "${sectionName}" is a descendent of itself.\nPath:\n\t${[...(parents ?? []), sectionName].join("\t => \n")}`);
                return null;
            }

            // Section already processed
            if (this.#sections.has(sectionName)) {
                return this.#sections.get(sectionName);
            }

            const groupNames = typeof sectionDef.groups === "string" ? [sectionDef.groups] : [...(sectionDef.groups??[])];
            for (const groupName of groupNames) {
                if (!groups[groupName]) {
                    this.#errors.push(`Group ${groupName} could not be found.\nPath:\n\t${[...parents, sectionName].join("\t => \n")}`)
                }
            }

            const section: Section = {
                title: sectionDef.title,
                id: sectionName,
                children: !Array.isArray(sectionDef.children) ? [...Object.keys(sectionDef.children ?? {})] : [...sectionDef.children],
                parents: [],
                locationReport: new LocationReport(),
                locations: [...groupNames.map((groupName) => groups[groupName]?.locations ?? []).flat(), ...(sectionDef.locations ?? [])],
                theme: { color: "#888888", ...themes[sectionDef.theme] }
            }

            this.#sections.set(sectionName, section);

            const childParents = [...(parents ?? []), sectionName];
            const children = !sectionDef.children ? [] :
                Array.isArray(sectionDef.children) ? sectionDef.children.map((childName) => parseSection_string(childName, childParents)) :
                    Object.entries(sectionDef.children).map(([childName, childDef]) => parseSection_v2Def(childDef, childName, childParents));
            children.forEach((child) => {
                if (child && !child.parents.includes(sectionName)) {
                    child.parents.push(sectionName);
                }
            });

            section.locations.forEach((value) => this.#locations.add(value));
            const subscriber = this.locationManager.getSubscriberCallback(new Set(section.locations));
            const cleanup = subscriber((_updatedLocations) => {
                this.#updateSection(sectionName);
            });
            this.#updateSection(sectionName);
            this.#cleanupCalls.add(cleanup);

        }

        parseSection_string("root");

        // extra validation
        const remainingGroups = new Set(Object.keys(groups));
        Object.entries(sections).forEach(([name, section]) => {
            if (!this.#sections.has(name)) {
                this.#errors.push(`Section ${name} can not be reached`);
            }
            const sectionGroups = typeof section.groups === "string" ? [section.groups] : [...(section.groups ?? [])];
            sectionGroups.forEach((name) => remainingGroups.delete(name));
        });
        remainingGroups.values().forEach((name) => this.#errors.push(`Group ${name} is unused.`));

        this.#sections.values().forEach((section) => {
            Object.freeze(section);
            Object.freeze(section.locations);
            Object.freeze(section.parents);
            Object.freeze(section.children);
        });

    }

    #updateSection = (sectionName: string, processedSections: Set<string> = new Set(), callListeners = true) => {
        if (processedSections.has(sectionName)) {
            return;
        }
        const section = this.#sections.get(sectionName);
        const locationReport = new LocationReport();
        section.locations.forEach((location) => {
            locationReport.addLocation(this.locationManager, location);
        });
        section.children.forEach((childName) => {
            const child = this.#sections.get(childName);
            if (child) {
                locationReport.addReport(child.locationReport);
            }
        });
        processedSections.add(sectionName);
        const newSection = {
            ...section
        }
        newSection.locationReport = locationReport;

        Object.freeze(newSection);

        this.#sections.set(sectionName, newSection);

        section.parents.forEach((parentName) => this.#updateSection(parentName, processedSections, false));

        if (callListeners) {
            this.#callListeners(sectionName);
        }
    }

    #callListeners = (_sectionName?: string) => {
        this.#listeners.values().forEach(listener => listener());
    }

    getUpdateSubscriber = (_name?: string) => {
        return (listener: () => void) => {
            this.#listeners.add(listener);
            return () => {
                this.#listeners.delete(listener);
            };
        };
    };

    getSection = (name: string) => {
        return this.#sections.get(name);
    };

    validateLocations = (locations: Set<string>) => {
        const missingLocations = locations.difference(this.#locations);
        if (missingLocations.size > 0) {
            this.#errors.push(`The following locations are missing from the custom location tracker:\n\t${[...missingLocations.values()].join("\n\t")}`)
        }
    }

    getErrors = () => {
        if(this.#cachedErrors.length !== this.#errors.length){
            this.#cachedErrors = [...this.#errors];
            Object.freeze(this.#cachedErrors);
        }
        return this.#cachedErrors;
    };

    exportDropdowns = () => {

    };
}

export default CustomLocationTracker;