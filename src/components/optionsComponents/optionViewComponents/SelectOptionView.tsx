import React, { useContext, useId } from "react";
import { SelectOption } from "../../../services/options/option";
import ServiceContext from "../../../contexts/serviceContext";
import useOption from "../../../hooks/optionHook";
import { JSONValue } from "../../../services/dataStores";

const SelectOptionView = ({
    option,
    style,
    className,
    parent,
    onUpdate,
}: {
    option: SelectOption;
    style?: React.CSSProperties;
    className?: string;
    parent?: { [propName: string]: JSONValue };
    onUpdate?: (optionName: string, value: string) => void;
}) => {
    const elementId = useId();
    const services = useContext(ServiceContext);
    const optionManager = services.optionManager;
    const scope = option.scope ?? "global";
    const value = (
        parent
            ? parent[option.name]
            : useOption(optionManager, option.name, scope)
    ) as string;
    return (
        <div className={className} style={style}>
            <label htmlFor={elementId}>{option.display ?? option.name}: </label>
            <select
                className="interactive"
                id={elementId}
                value={value}
                onChange={(event) => {
                    const value = event.target.value;
                    if (value && onUpdate) {
                        onUpdate(option.name, value);
                    } else if (value) {
                        optionManager.setOptionValue(option.name, scope, value);
                    }
                }}
            >
                {option.choices.map((choice, index) => (
                    <option
                        key={index}
                        value={
                            typeof choice === "string" ? choice : choice.name
                        }
                    >
                        {typeof choice === "string" ? choice : choice.display}
                    </option>
                ))}
            </select>
        </div>
    );
};
export default SelectOptionView;
