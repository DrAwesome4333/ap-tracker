import React from "react";
import useOption from "../../hooks/optionHook";
import { OptionManager } from "../../services/options/optionManager";

const ThemeOptions = ({ optionManager }: { optionManager: OptionManager }) => {
    const themeValue = useOption(optionManager, "theme", "global") as
        | "light"
        | "dark"
        | "system"
        | null;

    return (
        <>
            <label htmlFor={"global_theme"}>Theme: </label>
            <select
                className="interactive"
                id={"global_theme"}
                value={themeValue ?? "system"}
                onChange={(event) => {
                    const value = event.target.value;
                    if (value) {
                        optionManager.setOptionValue("theme", "global", value);
                        optionManager.saveScope("global");
                    }
                }}
            >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </>
    );
};

export default ThemeOptions;
