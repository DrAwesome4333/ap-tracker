type GroupData_V1 = {
    checks: string[];
    portals?: string[];
};

type SectionThemeDef_V1 = {
    color: string;
};

type CustomTrackerDef_V1 = {
    categories: { [categoryKey: string]: SectionDef_V1 };
    themes: { [themeKey: string]: SectionThemeDef_V1 };
};

type SectionDef_V1 = {
    title: string;
    type?: null;
    groupKey?: string[] | string | null;
    theme: string;
    children: string[] | null;
};

type CustomLocationTrackerDef_V1 = {
    groupData: { [groupKey: string]: GroupData_V1 };
    sectionData: CustomTrackerDef_V1;
    game: string;
    customTrackerVersion: 1;
    id?: string;
    name: string;
};
