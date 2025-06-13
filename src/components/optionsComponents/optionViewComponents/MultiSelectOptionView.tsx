import React, { useContext } from "react";
import { MultiselectOption } from "../../../services/options/option";
import ServiceContext from "../../../contexts/serviceContext";
import useOption from "../../../hooks/optionHook";
import { JSONValue } from "../../../services/dataStores";
import { Checkbox } from "../../inputs";

const MultiselectOptionView = ({
    option,
    style,
    className,
    parent,
    onUpdate,
}: {
    option: MultiselectOption;
    style?: React.CSSProperties;
    className?: string;
    parent?: { [propName: string]: JSONValue };
    onUpdate?: (optionName: string, value: string[]) => void;
}) => {
    const services = useContext(ServiceContext);
    const optionManager = services.optionManager;
    const scope = option.scope ?? "global";
    const value = (
        parent
            ? parent[option.name]
            : useOption(optionManager, option.name, scope)
    ) as string[];
    const update = (choice: string, checked: boolean) => {
        const newValues = new Set(value);
        if (checked) {
            newValues.add(choice);
        } else {
            newValues.delete(choice);
        }
        if (onUpdate) {
            onUpdate(option.name, [...newValues]);
        } else {
            optionManager.setOptionValue(option.name, scope, [...newValues]);
        }
    };
    return (
        <div className={className} style={style}>
            <h4>{option.display ?? option.name}</h4>
            {option.choices.map((choice) => {
                const name = typeof choice === "string" ? choice : choice.name;
                const display =
                    typeof choice === "string" ? choice : choice.display;
                return (
                    <div key={name}>
                        <Checkbox
                            label={display}
                            checked={value.includes(name)}
                            onChange={(event) =>
                                update(name, event.target.checked)
                            }
                        />
                    </div>
                );
            })}
        </div>
    );
};
export default MultiselectOptionView;
