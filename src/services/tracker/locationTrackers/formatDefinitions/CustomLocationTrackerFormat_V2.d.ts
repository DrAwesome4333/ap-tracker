import { LocationTrackerManifest } from "../locationTrackers";
type SectionDefs_V2 = { [sectionName: string]: SectionDef_V2 };

type ThemeDef_V2 = {
    color: string;
};

type SectionDef_V2 = {
    title?: string;
    locations?: string[];
    groups?: string[] | string;
    children?: string[] | SectionDefs_V2;
    theme?: string;
};

type GroupData_V2 = {
    locations: string[];
};

type CustomLocationTrackerDef_V2 = {
    manifest: LocationTrackerManifest;
    themes: { [themName: string]: ThemeDef_V2 };
    sections: SectionDefs_V2;
    groups?: { [groupName: string]: GroupData_V2 };
};
