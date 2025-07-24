import React, { useState } from "react";
import { PrimaryButton } from "../buttons";
import Icon from "../icons/icons";
import CreateCustomTrackerModal from "./CreateCustomTrackerModal";

import { CustomTrackerRepository } from "../../services/tracker/customTrackerRepository";
import TrackerTable from "./TrackerTable/TrackerTable";
const CustomTrackerOptions = ({
    customTrackerRepository,
}: {
    customTrackerRepository: CustomTrackerRepository;
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    return (
        <div>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <TrackerTable
                    customTrackerRepository={customTrackerRepository}
                />
                <br />
                <PrimaryButton
                    $tiny
                    onClick={() => {
                        setModalOpen(true);
                    }}
                >
                    <Icon type="add" />
                </PrimaryButton>
            </div>

            <CreateCustomTrackerModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                }}
            />
        </div>
    );
};

export default CustomTrackerOptions;
