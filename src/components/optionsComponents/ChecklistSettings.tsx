import React, { useState } from "react";
import ServiceContext from "../../contexts/serviceContext";
import SectionView from "../LocationTrackerViews/DropDownViewComponents/SectionView";
import { TagManager } from "../../services/tags/tagManager";
import { OptionManager } from "../../services/options/optionManager";
import { SecondaryButton } from "../shared/buttons";
import OptionView from "./OptionView";
import { baseTrackerOptions } from "../../services/options/trackerOptions";
import CustomLocationTracker from "../../services/tracker/locationTrackers/CustomLocationTracker";
import {
    ResourceType,
    LocationTrackerType,
} from "../../services/tracker/resourceEnums";
import { GamePackageWrapper } from "../../services/gamepackage/GamePackageWrapper";
import {
    LocationSource,
    LocationStatus,
    LocationUpdateCallback,
} from "../../services/locations/locationSource";
import LocationRepository from "../../services/locations/locationRepository";
import SlotContext from "../../contexts/slotContext";
class MockSource implements LocationSource {
    #locations: LocationStatus[] = [
        {
            locationId: 1,
            name: "Location 1",
            checked: true,
            ignored: false,
        },
        {
            locationId: 2,
            name: "Location 2",
            checked: false,
            ignored: false,
        },
        {
            locationId: 3,
            name: "Location 3",
            checked: true,
            ignored: false,
        },
        {
            locationId: 4,
            name: "Location 4",
            checked: false,
            ignored: false,
        },
        {
            locationId: 5,
            name: "Location 5",
            checked: false,
            ignored: false,
        },
        {
            locationId: 6,
            name: "Location 6",
            checked: true,
            ignored: false,
        },
        {
            locationId: 7,
            name: "Location 7",
            checked: false,
            ignored: false,
        },
        {
            locationId: 8,
            name: "Location 8",
            checked: true,
            ignored: false,
        },
        {
            locationId: 9,
            name: "Location 9",
            checked: false,
            ignored: false,
        },
    ];

    locationUpdateHook: (callback: LocationUpdateCallback) => () => void = (
        callback
    ) => {
        callback(this.#locations);
        return () => {};
    };
}
const mockSource = new MockSource();
const mockLocationRepository = new LocationRepository();
mockLocationRepository.addSource(mockSource);
const mockLocationTracker = new CustomLocationTracker(
    new GamePackageWrapper(
        {
            location_name_to_id: {
                "Location 1": 1,
                "Location 2": 2,
                "Location 3": 3,
                "Location 4": 4,
                "Location 5": 5,
                "Location 6": 6,
                "Location 7": 7,
                "Location 8": 8,
                "Location 9": 9,
                "Location 10": 10,
            },
            item_name_to_id: {},
            checksum: "",
            location_groups: {},
            item_groups: {},
        },
        "fake_game"
    ),
    {
        manifest: {
            type: ResourceType.locationTracker,
            uuid: null,
            name: "Mock Location Tracker",
            game: "fake_game",
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
                locations: [
                    "Location 2",
                    "Location 3",
                    "Location 5",
                    "Location 7",
                ],
            },
            composites: {
                title: "Composites",
                locations: [
                    "Location 4",
                    "Location 6",
                    "Location 8",
                    "Location 9",
                ],
            },
            tens: {
                title: "Tens",
                locations: ["Location 10"],
            },
        },
    }
);

const mockTagManager = new TagManager();

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
            <OptionView
                option={
                    baseTrackerOptions[
                        "LocationTracker:allow_tracker_option_overrides"
                    ]
                }
            />
            <br />
            <SecondaryButton
                small
                onClick={() => {
                    setPreviewOpen((x) => !x);
                }}
            >
                {previewOpen ? "Hide" : "Show"} Preview
            </SecondaryButton>
            {previewOpen && (
                <ServiceContext.Provider
                    value={{
                        optionManager,
                    }}
                >
                    <SlotContext.Provider
                        value={{
                            slotAlias: "Mock Alias",
                            locationTracker: mockLocationTracker,
                            locationRepository: mockLocationRepository,
                            slotName: "Mock Slot Name",
                            tagManager: mockTagManager,
                            liveSlot: false,
                        }}
                    >
                        <SectionView name="root" startOpen />
                    </SlotContext.Provider>
                </ServiceContext.Provider>
            )}
        </>
    );
};

export default ChecklistSettings;
