import React, { useContext } from "react";
import OptionView from "./OptionView";
import { baseTrackerOptions } from "../../services/options/trackerOptions";
import ServiceContext from "../../contexts/serviceContext";

const HintSettings = ({ hideTitle }: { hideTitle?: boolean }) => {
    const services = useContext(ServiceContext);
    const optionManager = services.optionManager;

    return (
        <div>
            <OptionView
                option={baseTrackerOptions["Tags:hint_settings"]}
                hideTitle={hideTitle}
                onUpdate={(name, value) => {
                    optionManager.setOptionValue(name, "global", value);
                }}
            />
            <p>
                Note: Counters only work if their respective tag is also
                enabled.
            </p>
        </div>
    );
};

export default HintSettings;
