import { useContext, useMemo, useState } from "react";
import styles from "./CreateCustomTrackerModal.module.css";
import Modal from "../../shared/Modal";
import {
    GhostButton,
    PrimaryButton,
    SecondaryButton,
} from "../../shared/buttons";
import { FileInput } from "../../inputs";
import CustomTrackerHelpModal from "../CustomTrackerHelpModal";
import NotificationManager, {
    MessageType,
} from "../../../services/notifications/notifications";
import { tertiary } from "../../../constants/colors";
import ServiceContext from "../../../contexts/serviceContext";
import { exportJSONFile } from "../../../utility/jsonExport";
import Icon from "../../icons/icons";
import ButtonRow from "../../LayoutUtilities/ButtonRow";
import NameAnalysisModal from "../NameAnalysisModal";
import CustomLocationTracker from "../../../services/tracker/locationTrackers/CustomLocationTracker";
import LocationGroupCategoryGenerator from "../../../services/tracker/generic/locationTrackerGenerators/locationGroup";
import { CustomLocationTrackerDef_V2 } from "../../../services/tracker/locationTrackers/formatDefinitions/CustomLocationTrackerFormat_V2";
import { CustomItemTrackerDef_V1 } from "../../../services/tracker/itemTrackers/formatDefinitions/CustomItemTrackerFormat_V1";
import { ResourceType } from "../../../services/tracker/resourceEnums";
import CustomItemTracker from "../../../services/tracker/itemTrackers/CustomItemTracker";
import GenericItemTracker from "../../../services/tracker/generic/GenericItemTracker";
import { randomUUID } from "../../../utility/uuid";
import useCurrentMultiworldSlot from "../../../hooks/useCurrentMultiworldSlot";
import { GamePackageWrapper } from "../../../services/gamepackage/GamePackageWrapper";
import DataPackageHelper from "../../../services/MultiInfo/DatapackageHelper";
import MultiWorldService from "../../../services/MultiInfo/MultiWorldService";
import GenericTrackerRepository from "../../../services/tracker/generic/genericTrackerRepository";
import EmptyGamePackageWrapper from "../../../services/gamepackage/EmptyGamePackageWrapper";

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
    const slot = useCurrentMultiworldSlot();
    const customTrackerRepository = services.customTrackerRepository;
    const trackerManager = services.trackerManager;
    const optionManager = services.optionManager;
    const genericTrackerRepository = useMemo(
        () => new GenericTrackerRepository(optionManager),
        [optionManager]
    );

    const loadDataPackage = async () => {
        if (!slot || !slot.game || !slot.multi_save_id) {
            return null;
        }
        const multiworld = MultiWorldService.getMultiWorld(slot.multi_save_id);
        const dataPackageHash = multiworld?.data_package_details[slot.game];
        const cachedPackage = await DataPackageHelper.getCachedPackage(
            slot.game,
            dataPackageHash
        );
        if (!cachedPackage) {
            NotificationManager.createToast({
                message: "Failed to load game's data package",
                details:
                    "Could not find the current game's data package to generate tracker file. Please reload the page and try again.",
                type: MessageType.error,
                duration: 5,
            });
            return null;
        }
        if (!cachedPackage.location_groups) {
            NotificationManager.createToast({
                message: "Game data package is incomplete",
                details:
                    "The game's data package is missing important details to generate a tracker file. Please reload the page and try again.",
                type: MessageType.error,
                duration: 5,
            });
            return null;
        }
        return cachedPackage;
    };

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
            .then(
                async (
                    data:
                        | CustomLocationTrackerDef_V1
                        | CustomLocationTrackerDef_V2
                        | CustomItemTrackerDef_V1
                ) => {
                    let testTracker: CustomItemTracker | CustomLocationTracker =
                        null;
                    if ("manifest" in data) {
                        if (
                            data.manifest.type === ResourceType.locationTracker
                        ) {
                            testTracker = new CustomLocationTracker(
                                new EmptyGamePackageWrapper(),
                                data as CustomLocationTrackerDef_V2
                            );
                        } else if (
                            data.manifest.type === ResourceType.itemTracker
                        ) {
                            testTracker = new CustomItemTracker(
                                optionManager,
                                data as CustomItemTrackerDef_V1
                            );
                        }
                    } else if ("customTrackerVersion" in data) {
                        testTracker = new CustomLocationTracker(
                            new EmptyGamePackageWrapper(),
                            data as CustomLocationTrackerDef_V1
                        );
                    }
                    if (!testTracker) {
                        statusHandle.update({
                            message: "Failed to recognize tracker data",
                            type: MessageType.error,
                            progress: 1,
                            duration: 4,
                        });
                        NotificationManager.createToast({
                            message: "Failed to recognize tracker data",
                            duration: 10,
                            type: MessageType.error,
                            details: `Tracker meta data could not be found in the provided file`,
                        });
                        return;
                    }

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
                }
            )
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
                console.error(e);
            });
        onClose();
    };
    return (
        <>
            <Modal
                open={open}
                header={<h3>Custom Trackers</h3>}
                footer={
                    <ButtonRow>
                        <SecondaryButton onClick={() => setHelpModalOpen(true)}>
                            Help
                        </SecondaryButton>
                        <GhostButton onClick={onClose}>Close</GhostButton>
                    </ButtonRow>
                }
            >
                <div className={styles.modal_grid}>
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
                            {slot?.game ? (
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
                                    disabled={!slot?.game}
                                    onClick={async () => {
                                        const cachedPackage =
                                            await loadDataPackage();
                                        const trackerJSON =
                                            LocationGroupCategoryGenerator.generateSectionDef(
                                                cachedPackage.location_groups
                                            );
                                        if (!trackerJSON) {
                                            return;
                                        }
                                        trackerJSON.manifest.game = slot.game;
                                        trackerJSON.manifest.name = `${slot.game} (${trackerJSON.manifest.uuid.substring(0, 8)})`;

                                        exportJSONFile(
                                            `tracker-export-${slot.game.replace(/\s/g, "")}-${trackerJSON.manifest.uuid.substring(0, 8)}`,
                                            trackerJSON,
                                            true
                                        );
                                    }}
                                >
                                    Location Group{" "}
                                    <Icon fontSize="14px" type="download" />
                                </PrimaryButton>
                                <PrimaryButton
                                    disabled={!slot?.game}
                                    onClick={async () => {
                                        const trackerId =
                                            genericTrackerRepository.resources.filter(
                                                (manifest) =>
                                                    manifest.type ===
                                                    ResourceType.itemTracker
                                            )[0];
                                        if (!trackerId) {
                                            return;
                                        }
                                        const cachedPackage =
                                            await loadDataPackage();
                                        const gamePackage =
                                            new GamePackageWrapper(
                                                cachedPackage,
                                                slot.game
                                            );
                                        const tracker =
                                            await genericTrackerRepository.loadResource(
                                                trackerId.uuid,
                                                trackerId.version,
                                                trackerId.type,
                                                gamePackage
                                            );
                                        const trackerJSON = (
                                            tracker as GenericItemTracker
                                        )?.exportGroups(randomUUID());
                                        trackerJSON.manifest.game = slot?.game;
                                        trackerJSON.manifest.name = `${slot?.game} (${trackerJSON.manifest.uuid.substring(0, 8)})`;
                                        exportJSONFile(
                                            `tracker-export-${slot?.game.replace(/\s/g, "")}-${trackerJSON.manifest.uuid.substring(0, 8)}`,
                                            trackerJSON,
                                            true
                                        );
                                    }}
                                >
                                    Item Group{" "}
                                    <Icon fontSize="14px" type="download" />
                                </PrimaryButton>
                                <PrimaryButton
                                    disabled={!slot?.game}
                                    onClick={() => setNameModalOpen(true)}
                                >
                                    Name Analysis
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
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
