import { OptionType } from "./optionEnums";
type BooleanOption = {
    type: OptionType.boolean;
    default: boolean;
} & BaseOption;

type SelectOption = {
    type: OptionType.select;
    choices: (string | { name: string; display: string })[];
    default: string;
} & BaseOption;

type MultiselectOption = {
    type: OptionType.multiselect;
    choices: (string | { name: string; display: string })[];
    default: string[];
} & BaseOption;

type NumberOption = {
    type: OptionType.number;
    default: number;
    max?: number;
    min?: number;
    step?: number;
} & BaseOption;

type ColorOption = {
    type: OptionType.color;
    default: string;
} & BaseOption;

type HierarchicalOption = {
    type: OptionType.hierarchical;
    children: TrackerOption[];
    format?: "column";
} & BaseOption;

interface BaseOption {
    name: string;
    display?: string;
    disabledWhen?: {
        name: string;
        values: (number | string | boolean)[];
    };
    scope?: string;
    apClasses?: string[];
}

type TrackerOption =
    | BooleanOption
    | SelectOption
    | NumberOption
    | MultiselectOption
    | HierarchicalOption
    | ColorOption;
