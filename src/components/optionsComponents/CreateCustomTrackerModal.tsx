import React, { useContext, useState } from "react";
import styled from "styled-components";
import Modal from "../shared/Modal";
import { GhostButton, PrimaryButton, SecondaryButton } from "../buttons";
import { FileInput } from "../inputs";
import CustomTrackerHelpModal from "./CustomTrackerHelpModal";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import { tertiary } from "../../constants/colors";
import ServiceContext from "../../contexts/serviceContext";
import { exportJSONFile } from "../../utility/jsonExport";
import Icon from "../icons/icons";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import NameAnalysisModal from "./NameAnalysisModal";
import CustomLocationTracker from "../../services/tracker/locationTrackers/CustomLocationTracker";
import LocationGroupCategoryGenerator from "../../services/tracker/generic/locationTrackerGenerators/locationGroup";

const ModalGrid = styled.div`
    display: grid;
    column-gap: 2em;

    grid:
        "upload" 25vh
        "build" 25vh / auto;
    @media only screen and (orientation: landscape) {
        & {
            grid: "upload build" 25vh / 1fr 1fr;
        }
    }
`;
const CreateCustomTrackerModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [nameModalOpen, setNameModalOpen] = useState(false);
    const services = useContext(ServiceContext);
    const connector = services.connector.connection;
    const locationManager = services.locationManager;
    const customTrackerRepository = services.customTrackerRepository;
    const trackerManager = services.trackerManager;

    /**
     * Passes the contents of a file to the CustomTrackerManager
     */
    const loadCustomTracker = (file: File) => {
        const statusHandle = NotificationManager.createStatus({
            message: "Loading Custom Tracker",
            type: MessageType.info,
            progress: -1,
        });
        file.text()
            .then((text) => JSON.parse(text))
            .then(async (data) => {
                const testTracker = new CustomLocationTracker(
                    locationManager,
                    data
                );
                const errors = testTracker.getErrors();
                if (errors.length > 0) {
                    statusHandle.update({
                        message: "Tracker failed verification",
                        type: MessageType.error,
                        progress: 1,
                        duration: 4,
                    });
                    NotificationManager.createToast({
                        message: "Tracker Failed verification",
                        duration: 10,
                        type: MessageType.error,
                        details: `Errors: \n${errors.join("\n\n")}`,
                    });
                } else {
                    statusHandle.update({
                        message: "Successfully added custom tracker",
                        type: MessageType.success,
                        progress: 1,
                        duration: 4,
                    });
                    customTrackerRepository.addTracker(data);
                    trackerManager.setGameTracker(
                        testTracker.manifest.game,
                        testTracker.manifest
                    );
                }
                return data;
            })
            .catch((e) => {
                statusHandle.update({
                    message: "Failed to load tracker",
                    progress: 0,
                    duration: 4,
                    type: MessageType.error,
                });
                NotificationManager.createToast({
                    message: "Failed to create custom tracker",
                    duration: 10,
                    type: MessageType.error,
                    details: `Error: \n\t${e}`,
                });
            });
        onClose();
    };
    return (
        <>
            <Modal open={open}>
                <div>
                    <h2>Custom Trackers (experimental)</h2>
                    <ModalGrid>
                        <div
                            style={{
                                gridArea: "upload",
                                alignSelf: "center",
                            }}
                        >
                            <h3>Add Custom Tracker:</h3>
                            <FileInput
                                label="Upload file"
                                id="custom_list_upload"
                                accept="application/JSON"
                                // renderAsDrop
                                onChange={(e) => {
                                    if (e.target.files.length > 0) {
                                        loadCustomTracker(e.target.files[0]);
                                    }
                                }}
                            />
                        </div>
                        <div
                            style={{
                                gridArea: "build",
                                alignSelf: "center",
                            }}
                        >
                            <div>
                                <h3>Generate a Template:</h3>
                                {connector.slotInfo.game ? (
                                    ""
                                ) : (
                                    <i style={{ color: tertiary }}>
                                        (connect to a slot first)
                                    </i>
                                )}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <PrimaryButton
                                        disabled={!connector.slotInfo.game}
                                        onClick={() => {
                                            const trackerJSON =
                                                LocationGroupCategoryGenerator.generateSectionDef(
                                                    connector.slotInfo.groups
                                                        .location
                                                );
                                            trackerJSON.manifest.game =
                                                connector.slotInfo.game;
                                            trackerJSON.manifest.name = `${connector.slotInfo.game} (${trackerJSON.manifest.uuid.substring(0, 8)})`;
                                            exportJSONFile(
                                                `tracker-export-${connector.slotInfo.game}-${Date.now().toString()}`,
                                                trackerJSON,
                                                true
                                            );
                                        }}
                                    >
                                        Location Group{" "}
                                        <Icon fontSize="14px" type="download" />
                                    </PrimaryButton>
                                    <PrimaryButton
                                        disabled={!connector.slotInfo.game}
                                        onClick={() => setNameModalOpen(true)}
                                    >
                                        Name Analysis
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </ModalGrid>
                    <ButtonRow>
                        <SecondaryButton onClick={() => setHelpModalOpen(true)}>
                            Help
                        </SecondaryButton>
                        <GhostButton onClick={onClose}>Close</GhostButton>
                    </ButtonRow>
                </div>
            </Modal>
            <CustomTrackerHelpModal
                open={helpModalOpen}
                onClose={() => setHelpModalOpen(false)}
            />
            <NameAnalysisModal
                open={nameModalOpen}
                onClose={() => setNameModalOpen(false)}
            />
        </>
    );
};

export default CreateCustomTrackerModal;
