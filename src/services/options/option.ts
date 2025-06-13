enum OptionType {
    boolean = "boolean",
    select = "select",
    multiselect = "multiselect",
    number = "number",
    hierarchical = "hierarchical",
}

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

type HierarchicalOption = {
    type: OptionType.hierarchical;
    children: Option[];
} & BaseOption;

interface BaseOption {
    name: string;
    display?: string;
    disabledWhen?: {
        name: string;
        values: (number | string | boolean)[];
    };
    scope?: string;
}

type Option =
    | BooleanOption
    | SelectOption
    | NumberOption
    | MultiselectOption
    | HierarchicalOption;

export { OptionType };
export type {
    Option,
    BooleanOption,
    SelectOption,
    NumberOption,
    MultiselectOption,
    HierarchicalOption,
};
