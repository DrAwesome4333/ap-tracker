import {
    HierarchicalOption,
    MultiselectOption,
    TrackerOption,
} from "../../options/option";
import { OptionType } from "../../options/optionEnums";
import { ItemTrackerType, ResourceType } from "../resourceEnums";
import {
    CustomItemTrackerDef_V1,
    ItemGroupDef,
} from "./formatDefinitions/CustomItemTrackerFormat_V1";
import {
    GroupItemTracker,
    ItemCollectionDef,
    ItemTrackerManifest,
    ItemTrackerUpdatePack,
} from "./itemTrackers";

class CustomItemTracker implements GroupItemTracker {
    manifest: ItemTrackerManifest;
    type = ItemTrackerType.group;
    protected groupListeners: Set<() => void> = new Set();
    protected optionListeners: Set<() => void> = new Set();
    protected cleanupCalls: Set<() => void> = new Set();
    protected groups: ItemCollectionDef[] = [];
    protected allGroups: ItemCollectionDef[] = [];
    protected cacheDirty: boolean = true;
    options: { [optionName: string]: TrackerOption } = {};
    #cachedGroups: ItemCollectionDef[] = [];

    constructor(data?: CustomItemTrackerDef_V1) {
        this.read(data);
    }
    protected callListeners = () => {
        this.cacheDirty = true;
        this.groupListeners.forEach((listener) => listener());
    };

    protected callOptionListeners = () => {
        this.optionListeners.forEach((listener) => listener());
    };

    protected read = (data: CustomItemTrackerDef_V1) => {
        this.cleanupCalls.forEach((call) => call());
        this.cleanupCalls.clear();
        this.groups = [];
        this.allGroups = [];
        this.callListeners();
        if (!data) {
            this.manifest = {
                type: ResourceType.itemTracker,
                uuid: null,
                game: null,
                version: "0.0.0",
                name: "Unknown Tracker",
            };

            return;
        }
        if (data.version !== 1) {
            throw new Error(
                `Unsupported Custom Item Tracker version ${data.version}`
            );
        }

        const parseGroup = (name: string, groupDef: ItemGroupDef) => {
            const collection: ItemCollectionDef = {
                name,
                allowedItems: new Set(),
            };
            if (Array.isArray(groupDef)) {
                collection.allowedItems = new Set(groupDef);
            } else {
                collection.name = groupDef.name ?? name;
                if (groupDef.items) {
                    collection.allowedItems = new Set(groupDef.items);
                }
            }
            Object.freeze(collection);
            this.groups.push(collection);
            this.allGroups.push(collection);
        };

        Object.entries(data.groups).forEach(([name, def]) =>
            parseGroup(name, def)
        );
        this.callListeners();
    };

    protected generateOptions = () => {
        const optionKey = `CustomTrackerOption:${this.manifest.uuid}-${this.manifest.type}-${this.manifest.version}`;
        const groupOption: MultiselectOption = {
            type: OptionType.multiselect,
            name: "enabledGroups",
            display: "Enabled groups",
            choices: [],
            default: [],
        };
        const options: HierarchicalOption = {
            type: OptionType.hierarchical,
            name: optionKey,
            display: "Options",
            children: [],
        };
        this.options = {
            [optionKey]: options,
        };

        this.groups.forEach((group) => {
            groupOption.choices.push(group.name);
            groupOption.default.push(group.name);
        });

        Object.freeze(options);
        Object.freeze(this.options);
        this.callOptionListeners();
    };

    reset = () => {};

    update = (updates: ItemTrackerUpdatePack) => {
        if (updates.options) {
            const options = updates.options;
            const optionKey = `CustomTrackerOption:${this.manifest.uuid}-${this.manifest.type}-${this.manifest.version}`;
            if (options[optionKey] && options[optionKey]["enabledGroups"]) {
                this.groups = this.allGroups.filter((x) =>
                    (<string[]>options[optionKey]["enabledGroups"]).includes(
                        x.name
                    )
                );
                Object.freeze(this.groups);
                this.callListeners();
            }
        }
    };

    getGroups = () => {
        if (this.cacheDirty) {
            this.#cachedGroups = [...this.groups];
            this.cacheDirty = false;
        }
        return this.#cachedGroups;
    };

    exportGroups = () => {
        // todo
        return null;
    };

    subscribeToGroups = (listener: () => void) => {
        this.groupListeners.add(listener);
        return () => {
            this.groupListeners.delete(listener);
        };
    };

    getUpdateSubscriber = () => {
        return (listener: () => void) => this.subscribeToGroups(listener);
    };

    subscribeToOptions = (listener: () => void) => {
        this.optionListeners.add(listener);
        return () => {
            this.optionListeners.delete(listener);
        };
    };

    getOptionSubscriber = () => {
        return (listener: () => void) => this.subscribeToOptions(listener);
    };
}

export default CustomItemTracker;
