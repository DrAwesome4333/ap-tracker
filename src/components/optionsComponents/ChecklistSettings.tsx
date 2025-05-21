import React, { useState } from "react";
import ServiceContext from "../../contexts/serviceContext";
import SectionView from "../sectionComponents/SectionView";
import useOption from "../../hooks/optionHook";
import { LocationManager } from "../../services/locations/locationManager";
import { createEntranceManager } from "../../services/entrances/entranceManager";
import { createGroupManager } from "../../services/sections/groupManager";
import { createSectionManager } from "../../services/sections/sectionManager";
import { createTagManager } from "../../services/tags/tagManager";
import { OptionManager } from "../../services/options/optionManager";
import { SecondaryButton } from "../buttons";

const mockLocationManager = new LocationManager();
const mockEntranceManager = createEntranceManager();
const mockGroupManager = createGroupManager(mockEntranceManager);
const mockSectionManager = createSectionManager(
    mockLocationManager,
    mockEntranceManager,
    mockGroupManager
);
const mockTagManager = createTagManager(mockLocationManager);

mockLocationManager.updateLocationStatus("Location 1", {
    exists: true,
    checked: true,
});
mockLocationManager.updateLocationStatus("Location 2", { exists: true });
mockLocationManager.updateLocationStatus("Location 3", {
    exists: true,
    checked: true,
});
mockLocationManager.updateLocationStatus("Location 4", { exists: true });
mockLocationManager.updateLocationStatus("Location 5", { exists: true });
mockLocationManager.updateLocationStatus("Location 6", {
    exists: true,
    checked: true,
});
mockLocationManager.updateLocationStatus("Location 7", { exists: true });
mockLocationManager.updateLocationStatus("Location 8", {
    exists: true,
    checked: true,
});
mockLocationManager.updateLocationStatus("Location 9", { exists: true });

mockGroupManager.loadGroups({
    one: {
        checks: ["Location 1"],
    },
    prime: {
        checks: ["Location 2", "Location 3", "Location 5", "Location 7"],
    },
    composite: {
        checks: ["Location 4", "Location 6", "Location 8", "Location 9"],
    },
    tens: {
        checks: [],
    },
});

mockSectionManager.setConfiguration({
    categories: {
        root: {
            title: "Numbers",
            type: null,
            groupKey: null,
            theme: "default",
            children: ["one", "primes", "composites", "tens"],
        },
        one: {
            title: "One",
            type: null,
            groupKey: "one",
            theme: "default",
            children: null,
        },
        primes: {
            title: "Primes",
            type: null,
            groupKey: "prime",
            theme: "default",
            children: null,
        },
        composites: {
            title: "Composites",
            type: null,
            groupKey: "composite",
            theme: "default",
            children: null,
        },
        tens: {
            title: "Tens",
            type: null,
            groupKey: "tens",
            theme: "default",
            children: null,
        },
    },
    options: {},
    themes: {
        default: { color: "#888888" },
    },
});

const ChecklistSettings = ({
    optionManager,
}: {
    optionManager: OptionManager;
}) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const checkedLocationBehavior = useOption(
        optionManager,
        "checkedLocationBehavior",
        "global"
    ) as string;
    const clearedSectionBehavior = useOption(
        optionManager,
        "clearedSectionBehavior",
        "global"
    ) as string;
    const checkOrderBehavior = useOption(
        optionManager,
        "checkOrderBehavior",
        "global"
    ) as string;
    return (
        <>
            <label htmlFor={"checked_location_behavior"}>
                Checked Location Behavior:{" "}
            </label>
            <select
                className="interactive"
                id={"checked_location_behavior"}
                value={checkedLocationBehavior ?? "nothing"}
                onChange={(event) => {
                    const value = event.target.value;
                    if (value) {
                        optionManager.setOptionValue(
                            "checkedLocationBehavior",
                            "global",
                            value
                        );
                        optionManager.saveScope("global");
                    }
                }}
            >
                <option value="nothing">Nothing</option>
                <option value="separate">Separate</option>
                <option value="hide">Hide</option>
            </select>
            <br />
            <label htmlFor={"cleared_section_behavior"}>
                Cleared Section Behavior:{" "}
            </label>
            <select
                className="interactive"
                id={"cleared_section_behavior"}
                value={clearedSectionBehavior ?? "nothing"}
                onChange={(event) => {
                    const value = event.target.value;
                    if (value) {
                        optionManager.setOptionValue(
                            "clearedSectionBehavior",
                            "global",
                            value
                        );
                        optionManager.saveScope("global");
                    }
                }}
            >
                <option value="nothing">Nothing</option>
                <option value="separate">Separate</option>
                <option value="hide">Hide</option>
            </select>
            <br />
            <label htmlFor={"check_order_behavior"}>Check Order: </label>
            <select
                className="interactive"
                id={"check_order_behavior"}
                value={checkOrderBehavior ?? "natural"}
                onChange={(event) => {
                    const value = event.target.value;
                    if (value) {
                        optionManager.setOptionValue(
                            "checkOrderBehavior",
                            "global",
                            value
                        );
                        optionManager.saveScope("global");
                    }
                }}
            >
                <option value="natural">Natural</option>
                <option value="lexical">Lexical</option>
                <option value="id">Internal id</option>
            </select>
            <br />
            <br />
            <SecondaryButton
                $small
                onClick={() => {
                    setPreviewOpen((x) => !x);
                }}
            >
                {previewOpen ? "Hide" : "Show"} Preview
            </SecondaryButton>
            {previewOpen && (
                <ServiceContext.Provider
                    value={{
                        locationManager: mockLocationManager,
                        entranceManager: mockEntranceManager,
                        groupManager: mockGroupManager,
                        sectionManager: mockSectionManager,
                        tagManager: mockTagManager,
                        optionManager,
                    }}
                >
                    <SectionView name="root" context={{}} startOpen />
                </ServiceContext.Provider>
            )}
        </>
    );
};

export default ChecklistSettings;
