import React, { useContext, useId } from "react";
import useOption from "../../hooks/optionHook";
import ServiceContext from "../../contexts/serviceContext";
import { Checkbox } from "../inputs";

const LayoutSettings = () => {
    const services = useContext(ServiceContext);
    const optionManager = services.optionManager;
    const layoutMode = useOption(
        optionManager,
        "Tracker:layout_mode",
        "global"
    ) as "auto" | "tab" | "flex";
    const showTextClient = useOption(
        services.optionManager,
        "TextClient:show",
        "global"
    ) as boolean;
    const layoutModeId = useId();
    return (
        <div>
            <label htmlFor={layoutModeId}>Layout: </label>
            <select
                className="interactive"
                id={layoutModeId}
                value={layoutMode ?? "auto"}
                onChange={(event) => {
                    const value = event.target.value;
                    if (value) {
                        optionManager.setOptionValue(
                            "Tracker:layout_mode",
                            "global",
                            value
                        );
                    }
                }}
            >
                <option value="auto">Auto</option>
                <option value="tab">Tabs</option>
                <option value="flex">Grid</option>
            </select>
            <br />
            <Checkbox
                label="Show Text Client"
                checked={showTextClient ?? true}
                onChange={(event) => {
                    optionManager.setOptionValue(
                        "TextClient:show",
                        "global",
                        event.target.checked
                    );
                }}
            />
        </div>
    );
};

export default LayoutSettings;
