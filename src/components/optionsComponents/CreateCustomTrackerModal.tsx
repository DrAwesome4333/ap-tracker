import React, { useContext, useState } from "react";
import styled from "styled-components";
import Modal from "../shared/Modal";
import { GhostButton, PrimaryButton, SecondaryButton } from "../buttons";
import { FileInput } from "../inputs";
import CustomTrackerHelpModal from "./CustomTrackerHelpModal";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import CustomTrackerManager from "../../games/generic/categoryGenerators/customTrackerManager";
import TrackerManager from "../../games/TrackerManager";
import { tertiary } from "../../constants/colors";
import ServiceContext from "../../contexts/serviceContext";
import { buildGenericGame } from "../../games/generic/genericGame";
import { GenericGameMethod } from "../../games/generic/categoryGenerators/genericGameEnums";
import { exportJSONFile } from "../../utility/jsonExport";
import Icon from "../icons/icons";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import NameAnalysisModal from "./NameAnalysisModal";

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
    trackerManager,
}: {
    open: boolean;
    onClose: () => void;
    trackerManager: TrackerManager;
}) => {
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [nameModalOpen, setNameModalOpen] = useState(false);
    const services = useContext(ServiceContext);
    const connector = services.connector.connection;
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
                await CustomTrackerManager.addCustomTracker(data);
                return data;
            })
            .then((data) => {
                statusHandle.update({
                    message: "Successfully added custom tracker",
                    type: MessageType.success,
                    progress: 1,
                    duration: 4,
                });

                trackerManager.setGameTracker(data.game, data.id);
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
                                            const trackerData =
                                                trackerManager.getTrackerInitParams();
                                            if (!trackerData) {
                                                NotificationManager.createToast(
                                                    {
                                                        message:
                                                            "Failed to export tracker, connect to a slot first",
                                                        type: MessageType.error,
                                                    }
                                                );
                                                return;
                                            }
                                            const tracker = buildGenericGame(
                                                connector.slotInfo.game,
                                                services.locationManager,
                                                services.inventoryManager,
                                                trackerData.groups,
                                                GenericGameMethod.locationGroup
                                            );
                                            const trackerJSON =
                                                tracker.exportTracker();
                                            exportJSONFile(
                                                `tracker-export-${tracker.gameName}-${Date.now().toString()}`,
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
