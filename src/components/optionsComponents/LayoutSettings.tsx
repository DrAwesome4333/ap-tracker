import React from "react";
import OptionView from "./OptionView";
import { baseTrackerOptions } from "../../services/options/trackerOptions";

const LayoutSettings = () => {
    return (
        <div>
            <OptionView option={baseTrackerOptions["Tracker:layout_mode"]} />
            <OptionView option={baseTrackerOptions["TextClient:show"]} />
        </div>
    );
};

export default LayoutSettings;
