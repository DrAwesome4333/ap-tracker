import { JSONValue } from "../../dataStores";
import {
    HierarchicalOption,
    MultiselectOption,
    TrackerOption,
} from "../../options/option";
import { OptionType } from "../../options/optionEnums";
import { OptionManager, setOptionDefaults } from "../../options/optionManager";
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
    protected groupListeners: Set<() => void> = new Set();
    protected optionListeners: Set<() => void> = new Set();
    protected cleanupCalls: Set<() => void> = new Set();
    protected groups: ItemCollectionDef[] = [];
    protected allGroups: ItemCollectionDef[] = [];
    protected cacheDirty: boolean = true;
    protected optionManager: OptionManager;
    protected discriminator: string;
    options: { [optionName: string]: TrackerOption } = {};
    #cachedGroups: ItemCollectionDef[] = [];

    constructor(optionManager: OptionManager, data?: CustomItemTrackerDef_V1) {
        this.optionManager = optionManager;
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
                itemTrackerType: ItemTrackerType.group,
                uuid: null,
                game: null,
                version: "0.0.0",
                name: "Unknown Tracker",
                formatVersion: 1,
            };

            return;
        }
        if (data.manifest.formatVersion !== 1) {
            throw new Error(
                `Unsupported Custom Item Tracker version ${data.manifest.formatVersion}`
            );
        }

        this.manifest = { ...data.manifest };

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
        this.generateOptions();
        this.callListeners();
    };

    protected generateOptions = () => {
        const optionKey = `CustomTrackerOption:${this.manifest.uuid}-${this.manifest.type}-${this.manifest.version}${this.discriminator ?? ""}`;
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
            children: [groupOption],
        };
        this.options = {
            [optionKey]: options,
        };

        this.groups.forEach((group) => {
            groupOption.choices.push(group.name);
            if (group.allowedItems.size > 1) {
                groupOption.default.push(group.name);
            }
        });
        setOptionDefaults(this.optionManager, this.options);
        const subscriber = this.optionManager.getSubscriberCallback(
            optionKey,
            "global"
        );
        const cleanupCall = subscriber(() => {
            this.update({
                options: this.optionManager.getOptionValue(
                    optionKey,
                    "global"
                ) as { [optionName: string]: JSONValue },
            });
        });
        this.cleanupCalls.add(cleanupCall);
        Object.freeze(options);
        Object.freeze(this.options);
        this.callOptionListeners();
        this.update({
            options: this.optionManager.getOptionValue(optionKey, "global") as {
                [optionName: string]: JSONValue;
            },
        });
    };

    reset = () => {};

    update = (updates: ItemTrackerUpdatePack) => {
        if (updates.options) {
            const options = updates.options;
            if (options["enabledGroups"]) {
                this.groups = this.allGroups.filter((x) =>
                    (<string[]>options["enabledGroups"]).includes(x.name)
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

    exportGroups = (newUuid?: string): CustomItemTrackerDef_V1 => {
        const manifest = {
            ...this.manifest,
            uuid: newUuid ?? this.manifest.uuid,
        };
        const def: CustomItemTrackerDef_V1 = {
            manifest,
            groups: {},
        };
        this.allGroups.forEach((group) => {
            def.groups[group.name] = {
                name: group.name,
                items: [...group.allowedItems.values()],
            };
        });
        return def;
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

    getErrors = () => {
        /** For future use */
        return [];
    };
}

export default CustomItemTracker;
