import React, { useContext } from "react";
import { BooleanOption } from "../../../services/options/option";
import ServiceContext from "../../../contexts/serviceContext";
import useOption from "../../../hooks/optionHook";
import { Checkbox } from "../../inputs";
import { JSONValue } from "../../../services/dataStores";
import apStyles from "../../sharedStyles/archipelago.module.css";

const CheckboxOptionView = ({
    option,
    className,
    style,
    parent,
    onUpdate,
}: {
    option: BooleanOption;
    className?: string;
    style?: React.CSSProperties;
    parent?: { [propName: string]: JSONValue };
    onUpdate?: (optionName: string, value: boolean) => void;
}) => {
    const services = useContext(ServiceContext);
    const optionManager = services.optionManager;
    const scope = option.scope ?? "global";
    const value = (
        parent
            ? parent[option.name]
            : useOption(optionManager, option.name, scope)
    ) as boolean;
    const classes = option.apClasses?.map((c) => apStyles[c]) ?? [];

    return (
        <div className={[className, ...classes].join(" ")} style={style}>
            <Checkbox
                label={option.display ?? option.name}
                checked={value}
                onChange={(event) => {
                    if (onUpdate) {
                        onUpdate(option.name, event.target.checked);
                    } else {
                        optionManager.setOptionValue(
                            option.name,
                            scope,
                            event.target.checked
                        );
                    }
                }}
            />
        </div>
    );
};
export default CheckboxOptionView;
