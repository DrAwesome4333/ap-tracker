import React from "react";
import SelectOptionView from "./optionViewComponents/SelectOptionView";
import CheckboxOptionView from "./optionViewComponents/CheckboxOptionView";
import HierarchicalOptionView from "./optionViewComponents/HierarchicalOptionView";
import { JSONValue } from "../../services/dataStores";
import MultiselectOptionView from "./optionViewComponents/MultiSelectOptionView";
import { TrackerOption } from "../../services/options/option";
import { OptionType } from "../../services/options/optionEnums";
import ColorOptionView from "./optionViewComponents/ColorOptionView";

const OptionView = ({
    option,
    hideTitle,
    ...props
}: {
    option: TrackerOption;
    parent?: { [propName: string]: JSONValue };
    style?: React.CSSProperties;
    className?: string;
    hideTitle?: boolean;
    onUpdate?: (optionName: string, value: JSONValue) => void;
}) => {
    return (
        <div>
            {option.type === OptionType.select ? (
                <SelectOptionView option={option} {...props} />
            ) : option.type === OptionType.boolean ? (
                <CheckboxOptionView option={option} {...props} />
            ) : option.type === OptionType.multiselect ? (
                <MultiselectOptionView
                    option={option}
                    {...props}
                    hideTitle={hideTitle}
                />
            ) : option.type === OptionType.hierarchical ? (
                <HierarchicalOptionView
                    option={option}
                    {...props}
                    hideTitle={hideTitle}
                />
            ) : option.type === OptionType.color ? (
                <ColorOptionView option={option} {...props} />
            ) : (
                <p style={{ color: "red" }}>
                    Not Implemented Option type {option.type} for {option.name}
                </p>
            )}
        </div>
    );
};
export default OptionView;
