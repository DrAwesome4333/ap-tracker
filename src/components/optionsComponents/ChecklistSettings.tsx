import React, { useState } from "react";
import ServiceContext from "../../contexts/serviceContext";
import SectionView from "../LocationTrackerViews/DropDownViewComponents/SectionView";
import { LocationManager } from "../../services/locations/locationManager";
import { createEntranceManager } from "../../services/entrances/entranceManager";
import { createTagManager } from "../../services/tags/tagManager";
import { OptionManager } from "../../services/options/optionManager";
import { SecondaryButton } from "../buttons";
import OptionView from "./OptionView";
import { baseTrackerOptions } from "../../services/options/trackerOptions";
import CustomLocationTracker from "../../services/tracker/locationTrackers/CustomLocationTracker";
import {
    ResourceType,
    LocationTrackerType,
} from "../../services/tracker/resourceEnums";
const mockLocationManager = new LocationManager();
const mockEntranceManager = createEntranceManager();
const mockLocationTracker = new CustomLocationTracker(mockLocationManager, {
    manifest: {
        type: ResourceType.locationTracker,
        uuid: null,
        name: "Mock Location Tracker",
        game: null,
        locationTrackerType: LocationTrackerType.dropdown,
        formatVersion: 2,
        version: "0.0.0",
    },
    themes: {
        default: {
            color: "#888888",
        },
    },
    sections: {
        root: {
            title: "Numbers",
            theme: "default",
            children: ["one", "primes", "composites", "tens"],
        },
        one: {
            title: "One",
            locations: ["Location 1"],
        },
        primes: {
            title: "Primes",
            locations: ["Location 2", "Location 3", "Location 5", "Location 7"],
        },
        composites: {
            title: "Composites",
            locations: ["Location 4", "Location 6", "Location 8", "Location 9"],
        },
        tens: {
            title: "Tens",
            locations: ["Location 10"],
        },
    },
});

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

const ChecklistSettings = ({
    optionManager,
}: {
    optionManager: OptionManager;
}) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    return (
        <>
            <OptionView
                option={
                    baseTrackerOptions[
                        "LocationTracker:cleared_location_behavior"
                    ]
                }
            />
            <OptionView
                option={
                    baseTrackerOptions[
                        "LocationTracker:cleared_section_behavior"
                    ]
                }
            />
            <OptionView
                option={baseTrackerOptions["LocationTracker:location_order"]}
            />
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
                        locationTracker: mockLocationTracker,
                        tagManager: mockTagManager,
                        optionManager,
                    }}
                >
                    <SectionView name="root" startOpen />
                </ServiceContext.Provider>
            )}
        </>
    );
};

export default ChecklistSettings;
