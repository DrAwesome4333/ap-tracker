import React, { useContext } from "react";
import { HierarchicalOption } from "../../../services/options/option";
import OptionView from "../OptionView";
import { JSONValue } from "../../../services/dataStores";
import ServiceContext from "../../../contexts/serviceContext";
import useOption from "../../../hooks/optionHook";

const HierarchicalOptionView = ({
    option,
    style,
    className,
    parent,
    onUpdate,
}: {
    option: HierarchicalOption;
    style?: React.CSSProperties;
    className?: string;
    parent?: { [propName: string]: JSONValue };
    onUpdate?: (
        optionName: string,
        value: { [propName: string]: JSONValue }
    ) => void;
}) => {
    const services = useContext(ServiceContext);
    const optionManager = services.optionManager;
    const scope = option.scope ?? "global";
    const value = (
        parent
            ? parent[option.name]
            : useOption(optionManager, option.name, scope)
    ) as { [propName: string]: JSONValue };
    const updateValue = (optionName: string, newValue: JSONValue) => {
        const updatedValue = { ...value };
        updatedValue[optionName] = newValue;
        Object.freeze(updatedValue);
        if (onUpdate) {
            onUpdate(option.name, updatedValue);
        } else {
            optionManager.setOptionValue(option.name, scope, updatedValue);
        }
    };
    return (
        <div className={className} style={style}>
            <h3>{option.display ?? option.name}</h3>
            <div
                style={{
                    marginLeft: "0.5em",
                    display: "flex",
                    columnGap: "2em",
                    overflowY: "auto",
                    flexWrap: "wrap",
                }}
            >
                {option.children.map((child) => (
                    <OptionView
                        option={child}
                        parent={value}
                        key={child.name}
                        onUpdate={updateValue}
                    />
                ))}
            </div>
        </div>
    );
};
export default HierarchicalOptionView;
