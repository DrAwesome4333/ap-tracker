import { JSONValue } from "../../dataStores";
import { TrackerOption } from "../../options/option";
import { BaseResourceManifest } from "../resource";
import { ResourceType, LocationTrackerType } from "../resourceEnums";
import {
    CustomLocationTrackerDef_V2,
    ThemeDef_V2,
} from "./formatDefinitions/CustomLocationTrackerFormat_V2";
import LocationReport from "./LocationReport";

type LocationTrackerManifest = {
    type: ResourceType.locationTracker;
    locationTrackerType: LocationTrackerType;
    game: string;
    formatVersion: number;
} & BaseResourceManifest;

/** Values that have changed since the last update*/
interface LocationTrackerUpdatePack {
    options?: { [optionName: string]: JSONValue };
    slotData?: unknown;
    locationGroups?: { [groupName: string]: string[] };
}

interface BaseLocationTracker {
    readonly manifest: LocationTrackerManifest;
    readonly options?: { [optionName: string]: TrackerOption };
    getUpdateSubscriber: () => (listener: () => void) => () => void;
    update?: (updates: LocationTrackerUpdatePack) => void;
    reset?: () => void;
}

type DropdownLocationTracker = {
    readonly type: LocationTrackerType.dropdown;
    getSection: (name: string) => Section;
    exportDropdowns: (newUuid?: string) => CustomLocationTrackerDef_V2;
    getUpdateSubscriber: (name?) => (listener: () => void) => () => void;
} & BaseLocationTracker;

type ThemeDef = ThemeDef_V2;

interface Section {
    id: string;
    title: string;
    locationReport: LocationReport;
    locations: string[];
    portals?: unknown;
    theme: ThemeDef;
    children: string[];
    parents: string[];
}

type LocationTracker = DropdownLocationTracker;

export type {
    LocationTracker,
    Section,
    ThemeDef,
    DropdownLocationTracker,
    LocationTrackerManifest,
    LocationTrackerUpdatePack,
    BaseLocationTracker,
};
