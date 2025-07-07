import React, { useState } from "react";
import PanelHeader from "../shared/PanelHeader";
import SectionView from "./DropDownViewComponents/SectionView";
import StickySpacer from "../shared/StickySpacer";
import { PrimaryButton } from "../buttons";
import Icon from "../icons/icons";
import DropdownFilterModal from "./DropDownViewComponents/DropdownFilterModal";

const LocationTrackerDropdownView = () => {
    const [showFilterModal, setShowFilterModal] = useState(false);
    return (
        <>
            <PanelHeader title="Locations">
                <PrimaryButton
                    $tiny
                    style={{ height: "20px" }}
                    onClick={() => setShowFilterModal(true)}
                >
                    <Icon fontSize="12pt" type="filter_alt" />
                </PrimaryButton>
            </PanelHeader>
            <SectionView name="root" />
            <StickySpacer />
            <DropdownFilterModal
                open={showFilterModal}
                onClose={() => setShowFilterModal(false)}
            />
        </>
    );
};

export default LocationTrackerDropdownView;
