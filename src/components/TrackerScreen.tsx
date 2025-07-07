import React, { useContext, useMemo } from "react";
import InventoryView from "./inventoryComponents/InventoryView";
import ServiceContext from "../contexts/serviceContext";
import useOption from "../hooks/optionHook";
import TextClient from "./textClient/TextClient";
import Flex from "./LayoutUtilities/Flex";
import Tabs, { Tab } from "./LayoutUtilities/Tabs";
import { useOrientation } from "../hooks/mediaHook";
import LocationTrackerDropdownView from "./LocationTrackerViews/DropdownView";

type TrackerLayoutMode = "auto" | "tab" | "flex";

const TrackerScreen = () => {
    const services = useContext(ServiceContext);
    const showTextClient = useOption(
        services.optionManager,
        "TextClient:show",
        "global"
    ) as boolean;
    const layoutMode = useOption(
        services.optionManager,
        "Tracker:layout_mode",
        "global"
    ) as TrackerLayoutMode;
    const orientation = useOrientation();
    const useTabLayout =
        layoutMode === "tab" ||
        (layoutMode === "auto" && !orientation.includes("landscape"));
    const inventory = (
        <>
            <InventoryView />
        </>
    );
    const checklist = (
        <>
            <div style={{ display: "grid", gridTemplateRows: "3em 1fr" }}>
                <LocationTrackerDropdownView />
            </div>
        </>
    );

    const textClient = <TextClient />;
    const clientAndList = (
        <Flex direction="column" child1={checklist} child2={textClient} />
    );
    const tabs = useMemo(() => {
        const res = [
            new Tab("Locations", checklist),
            new Tab("Inventory", inventory),
        ];
        if (showTextClient) {
            res.push(new Tab("Text Client", textClient));
        }
        return res;
    }, [showTextClient]);

    if (useTabLayout) {
        return <Tabs tabs={tabs} style={{ width: "100%", height: "100%" }} />;
    }
    return showTextClient ? (
        <Flex
            direction="row"
            style={{ width: "100%", height: "100%" }}
            startRatio={0.25}
            child1={inventory}
            child2={clientAndList}
        />
    ) : (
        <Flex
            direction="row"
            style={{ width: "100%", height: "100%" }}
            startRatio={0.25}
            child1={inventory}
            child2={checklist}
        />
    );
};

export default TrackerScreen;
