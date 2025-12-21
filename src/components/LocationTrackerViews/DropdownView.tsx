import React, { useState } from "react";
import PanelHeader from "../shared/PanelHeader";
import SectionView from "./DropDownViewComponents/SectionView";
import StickySpacer from "../shared/StickySpacer";
import { PrimaryButton } from "../shared/buttons";
import Icon from "../icons/icons";
import DropdownFilterModal from "./DropDownViewComponents/DropdownFilterModal";
import LocationDetails from "./LocationDetails";
import styles from "./LocationTracker.module.css";

const LocationTrackerDropdownView = () => {
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [focusedLocation, setFocusedLocation] = useState("");
    return (
        <>
            <div className={styles.dropdown_view}>
                <PanelHeader title="Locations">
                    <PrimaryButton
                        tiny
                        style={{ height: "20px" }}
                        onClick={() => setShowFilterModal(true)}
                    >
                        <Icon fontSize="12pt" type="filter_alt" />
                    </PrimaryButton>
                </PanelHeader>
                <div
                    className={[
                        styles.dropdown_container,
                        focusedLocation
                            ? [styles.dropdown_container_with_details]
                            : [],
                    ]
                        .flat()
                        .join(" ")}
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
