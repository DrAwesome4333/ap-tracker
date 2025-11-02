import React, { useState } from "react";
import PanelHeader from "../shared/PanelHeader";
import SectionView from "./DropDownViewComponents/SectionView";
import StickySpacer from "../shared/StickySpacer";
import { PrimaryButton } from "../buttons";
import Icon from "../icons/icons";
import DropdownFilterModal from "./DropDownViewComponents/DropdownFilterModal";
import LocationDetails from "./LocationDetails";

const LocationTrackerDropdownView = () => {
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [focusedLocation, setFocusedLocation] = useState("");
    return (
        <>
            <div
                style={{
                    boxSizing: "border-box",
                    padding: "0.25em",
                    display: "grid",
                    height: "100%",
                    width: "100%",
                    gridTemplateRows: "3em auto",
                }}
            >
                <PanelHeader title="Locations">
                    <PrimaryButton
                        $tiny
                        style={{ height: "20px" }}
                        onClick={() => setShowFilterModal(true)}
                    >
                        <Icon fontSize="12pt" type="filter_alt" />
                    </PrimaryButton>
                </PanelHeader>
                <div
                    style={{
                        display: "grid",
                        minWidth: 0,
                        minHeight: 0,
                        gridTemplateColumns: focusedLocation
                            ? "2fr 1fr"
                            : "auto",
                    }}
                >
                    <div
                        style={{
                            overflowY: "scroll",
                            padding: "0.25em",
                            boxSizing: "border-box",
                            minWidth: 0,
                            minHeight: 0,
                        }}
                    >
                        <SectionView
                            name="root"
                            onLocationSelect={(locationName) => {
                                setFocusedLocation(locationName);
                            }}
                            selectedLocation={focusedLocation}
                        />
                        <StickySpacer />
                    </div>
                    {focusedLocation && (
                        <div style={{ minWidth: 0, minHeight: 0 }}>
                            <LocationDetails
                                locationName={focusedLocation}
                                onClose={() => setFocusedLocation("")}
                            />
                        </div>
                    )}
                </div>
            </div>
            <DropdownFilterModal
                open={showFilterModal}
                onClose={() => setShowFilterModal(false)}
            />
        </>
    );
};

export default LocationTrackerDropdownView;
