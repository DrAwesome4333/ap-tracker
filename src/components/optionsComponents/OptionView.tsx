import React from "react";
import SelectOptionView from "./optionViewComponents/SelectOptionView";
import CheckboxOptionView from "./optionViewComponents/CheckboxOptionView";
import HierarchicalOptionView from "./optionViewComponents/HierarchicalOptionView";
import { JSONValue } from "../../services/dataStores";
import MultiselectOptionView from "./optionViewComponents/MultiSelectOptionView";
import { TrackerOption } from "../../services/options/option";
import { OptionType } from "../../services/options/optionEnums";

const OptionView = ({
    option,
    ...props
}: {
    option: TrackerOption;
    parent?: { [propName: string]: JSONValue };
    style?: React.CSSProperties;
    className?: string;
    onUpdate?: (optionName: string, value: JSONValue) => void;
}) => {
    return (
        <div>
            {option.type === OptionType.select ? (
                <SelectOptionView option={option} {...props} />
            ) : option.type === OptionType.boolean ? (
                <CheckboxOptionView option={option} {...props} />
            ) : option.type === OptionType.multiselect ? (
                <MultiselectOptionView option={option} {...props} />
            ) : option.type === OptionType.hierarchical ? (
                <HierarchicalOptionView option={option} {...props} />
            ) : (
                <p style={{ color: "red" }}>
                    Not Implemented Option type {option.type} for {option.name}
                </p>
            )}
        </div>
    );
};
export default OptionView;
