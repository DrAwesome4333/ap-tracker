import React, { useContext } from "react";
import ServiceContext from "../../contexts/serviceContext";
import CustomTrackerOptions from "./CustomTrackerOptions";
import OptionBlock from "./OptionBlock";
import StickySpacer from "../shared/StickySpacer";
import ChecklistSettings from "./ChecklistSettings";
import { baseTrackerOptions } from "../../services/options/trackerOptions";
import OptionView from "./OptionView";
import InventorySettings from "./InventorySettings";
import LayoutSettings from "./LayoutSettings";

const OptionsScreen = () => {
    const serviceContext = useContext(ServiceContext);
    const optionManager = serviceContext.optionManager;
    if (!optionManager) {
        throw new Error(
            "No option manager provided for option screen, you should be worried"
        );
    }
    const trackerManager = serviceContext.trackerManager;
    if (!trackerManager) {
        console.warn("No tracker manager provided");
    }
    const customTrackerRepository = serviceContext.customTrackerRepository;
    if (!customTrackerRepository) {
        console.warn("No custom tracker repository added");
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
            }}
        >
            <OptionBlock title="Theme Settings">
                <OptionView option={baseTrackerOptions["Theme:base"]} />
            </OptionBlock>
            <OptionBlock title="Tracker Layout">
                <LayoutSettings />
            </OptionBlock>
            <OptionBlock title="Checklist Settings">
                <ChecklistSettings optionManager={optionManager} />
            </OptionBlock>
            <OptionBlock title="Inventory Settings">
                <InventorySettings />
            </OptionBlock>
            <OptionBlock title="Custom Tracker Manager">
                {customTrackerRepository ? (
                    <CustomTrackerOptions
                        customTrackerRepository={customTrackerRepository}
                    />
                ) : (
                    <i>Failed to initiate tracker manager</i>
                )}
            </OptionBlock>

            <OptionBlock title="Attributions">
                <img
                    src="./icon.svg"
                    width={"64px"}
                    style={{ float: "left", marginRight: "1em" }}
                />
                The Archipelago Logos used by this app are the modified works of
                Krista Corkos and Christopher Wilson (© 2022) and is licensed
                under Attribution-NonCommercial 4.0 International. To view a
                copy of this license, visit{" "}
                <a
                    href="http://creativecommons.org/licenses/by-nc/4.0/"
                    target="_blank"
                    rel="noreferrer"
                >
                    http://creativecommons.org/licenses/by-nc/4.0/
                </a>
                <br />
                <br />
                This app is primarily built using{" "}
                <a href="https://react.dev/" target="_blank" rel="noreferrer">
                    React
                </a>{" "}
                and{" "}
                <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
                    NextJS
                </a>{" "}
                with{" "}
                <a
                    href="https://github.com/ThePhar/archipelago.js"
                    target="_blank"
                    rel="noreferrer"
                >
                    Archipelago.js
                </a>{" "}
                to connect to Archipelago. <br />
                More information about other libraries used and their licenses
                can be found on this project&apos;s{" "}
                <a
                    href="https://github.com/DrAwesome4333/ap-tracker"
                    target="_blank"
                    rel="noreferrer"
                >
                    GitHub repository
                </a>
                . Please report any problems you find there.
            </OptionBlock>
            <div
                style={{
                    textAlign: "center",
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "1em",
                }}
            >
                Version: {process.env.NEXT_PUBLIC_APP_VERSION}
            </div>
            <StickySpacer />
        </div>
    );
};

export default OptionsScreen;
