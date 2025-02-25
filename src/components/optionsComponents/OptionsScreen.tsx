import React, { useContext } from "react";
import ServiceContext from "../../contexts/serviceContext";
import TrackerPicker from "./TrackerPicker";
import CustomTrackerOptions from "./CustomTrackerOptions";
import OptionBlock from "./OptionBlock";
import StickySpacer from "../shared/StickySpacer";
import ChecklistSettings from "./ChecklistSettings";
import ThemeOptions from "./ThemeOptions";

const OptionsScreen = () => {
    const serviceContext = useContext(ServiceContext);
    const optionManager = serviceContext.optionManager;
    if (!optionManager) {
        throw new Error(
            "No option manager provided for option screen, you should be worried"
        );
    }

    return (
        <div>
            <OptionBlock title="Theme Settings">
                <ThemeOptions optionManager={optionManager} />
            </OptionBlock>
            <OptionBlock title="Checklist Settings">
                <ChecklistSettings optionManager={optionManager} />
            </OptionBlock>
            <OptionBlock title="Tracker Picker">
                <TrackerPicker />
            </OptionBlock>
            <OptionBlock title="Custom Tracker Manager">
                <CustomTrackerOptions />
            </OptionBlock>
            <OptionBlock title="Attributions">
                <img src="./icon.svg" width={"64px"} style={{float:"left", marginRight: "1em"}}/>
                The Archipelago Logos used by this app are the modified works of Krista Corkos and Christopher Wilson (© 2022) and is licensed under Attribution-NonCommercial 4.0 International. To view a copy of this license, visit <a href="http://creativecommons.org/licenses/by-nc/4.0/">http://creativecommons.org/licenses/by-nc/4.0/</a>
                <br/>
                <br/>
                This app is primarily built using <a href="https://react.dev/">React</a> and <a href="https://nextjs.org/">NextJS</a> with <a href="https://github.com/ThePhar/archipelago.js">Archipelago.js</a> to connect to Archipelago. <br/>
                More information about other libraries used and their licenses can be found on this project's <a href="https://github.com/DrAwesome4333/ap-tracker">GitHub repository</a>. Please report any problems you find there.
            </OptionBlock>
            <StickySpacer />
        </div>
    );
};

export default OptionsScreen;
