import React, { useContext, useEffect, useState } from "react";
import Modal from "../shared/Modal";
import styled from "styled-components";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { GhostButton, PrimaryButton, SecondaryButton } from "../buttons";
import Icon from "../icons/icons";
import { LocationManager } from "../../services/locations/locationManager";
import { createEntranceManager } from "../../services/entrances/entranceManager";
import ServiceContext from "../../contexts/serviceContext";
import { NameTokenizationOptions } from "../../services/tracker/generic/locationTrackerGenerators/locationName";
import { Checkbox, Input } from "../inputs";
import SectionView from "../LocationTrackerViews/DropDownViewComponents/SectionView";
import { createTagManager } from "../../services/tags/tagManager";
import { GenericGameMethod } from "../../services/tracker/generic/genericGameEnums";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import { exportJSONFile } from "../../utility/jsonExport";
import { InventoryManager } from "../../services/inventory/inventoryManager";
import { ResourceType } from "../../services/tracker/resourceEnums";
import TemplateLocationTracker from "../../services/tracker/generic/templateTracker";
import { randomUUID } from "../../utility/uuid";

interface AdditionalParams {
    minChecksPerGroup?: number;
    minTokenCount?: number;
    maxDepth?: number;
}

const AnalysisGrid = styled.div`
    display: grid;
    column-gap: 2em;
    width: 80vw;

    grid:
        "preview" 25vh
        "parameters" 25vh / auto;
    @media only screen and (orientation: landscape) {
        & {
            grid: "preview parameters" 50vh / 1fr 1fr;
        }
    }
`;

const previewLocationManager = new LocationManager();
const previewInventoryManager = new InventoryManager();
const templateLocationTracker = new TemplateLocationTracker(
    previewLocationManager
);
const previewEntranceManager = createEntranceManager();
const previewTagManager = createTagManager(previewLocationManager);

const NameAnalysisModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const mainTrackerManager = services.trackerManager;
    const connection = services.connector.connection;
    const customTrackerRepository = services.customTrackerRepository;

    const [tokenOptions, setTokenOptions]: [
        NameTokenizationOptions,
        React.Dispatch<React.SetStateAction<NameTokenizationOptions>>,
    ] = useState({
        splitCharacters: [" ", ".", "_", "-", ":"],
        splitOnCase: true,
        characterSplit: false,
    });

    const [otherOptions, setOtherOptions]: [
        AdditionalParams,
        React.Dispatch<React.SetStateAction<AdditionalParams>>,
    ] = useState({
        maxDepth: 1,
        minChecksPerGroup: 3,
        minTokenCount: 1,
    });

    const [textOptionsTemp, setTextOptionsTemp]: [
        { [key: string]: string },
        React.Dispatch<React.SetStateAction<{ [key: string]: string }>>,
    ] = useState({
        maxDepth: "1",
        minChecksPerGroup: "3",
        minTokenCount: "1",
    });

    const removeSplitChar = (char: string) => {
        const currentValues = new Set(tokenOptions.splitCharacters);
        currentValues.delete(char);
        setTokenOptions({
            ...tokenOptions,
            splitCharacters: [...currentValues.values()],
        });
    };
    const addSplitChar = (char: string) => {
        const currentValues = new Set(tokenOptions.splitCharacters);
        currentValues.add(char);
        setTokenOptions({
            ...tokenOptions,
            splitCharacters: [...currentValues.values()],
        });
    };

    useEffect(() => {
        if (connection.slotInfo.game && open) {
            previewLocationManager.pauseUpdateBroadcast();
            previewLocationManager.deleteAllLocations();
            connection.slotInfo.groups.location["Everywhere"].forEach(
                (location) => {
                    previewLocationManager.updateLocationStatus(location, {
                        exists: true,
                    });
                }
            );
            previewLocationManager.resumeUpdateBroadcast();
        }
        if (open) {
            templateLocationTracker.configure(
                connection.slotInfo.groups,
                GenericGameMethod.nameAnalysis,
                {
                    tokenOptions,
                    groupRequirements: {
                        minGroupSize: otherOptions.minChecksPerGroup,
                        maxDepth: otherOptions.maxDepth,
                        minTokenCount: otherOptions.minTokenCount,
                    },
                }
            );
        }
    }, [mainTrackerManager, tokenOptions, otherOptions, open]);

    return (
        <Modal open={open}>
            <h2>Name Analysis</h2>
            <AnalysisGrid>
                <div
                    style={{
                        gridArea: "preview",
                        overflow: "auto",
                        padding: "1em",
                    }}
                >
                    <h3>Preview</h3>
                    <ServiceContext.Provider
                        value={{
                            locationManager: previewLocationManager,
                            entranceManager: previewEntranceManager,
                            inventoryManager: previewInventoryManager,
                            tagManager: previewTagManager,
                            optionManager: services.optionManager,
                            locationTracker: templateLocationTracker,
                        }}
                    >
                        <SectionView name="root" />
                    </ServiceContext.Provider>
                </div>
                <div
                    style={{
                        gridArea: "parameters",
                        overflow: "auto",
                        padding: "1em",
                    }}
                >
                    <h3>Parameters</h3>
                    <h4>Split Characters</h4>
                    <Checkbox
                        disabled={tokenOptions.characterSplit}
                        label="Space"
                        checked={tokenOptions.splitCharacters.includes(" ")}
                        onChange={(e) => {
                            if (e.target.checked) {
                                addSplitChar(" ");
                            } else {
                                removeSplitChar(" ");
                            }
                        }}
                    />
                    <br />
                    <Checkbox
                        disabled={tokenOptions.characterSplit}
                        label="."
                        checked={tokenOptions.splitCharacters.includes(".")}
                        onChange={(e) => {
                            if (e.target.checked) {
                                addSplitChar(".");
                            } else {
                                removeSplitChar(".");
                            }
                        }}
                    />
                    <br />
                    <Checkbox
                        disabled={tokenOptions.characterSplit}
                        label="-"
                        checked={tokenOptions.splitCharacters.includes("-")}
                        onChange={(e) => {
                            if (e.target.checked) {
                                addSplitChar("-");
                            } else {
                                removeSplitChar("-");
                            }
                        }}
                    />
                    <br />
                    <Checkbox
                        disabled={tokenOptions.characterSplit}
                        label="_"
                        checked={tokenOptions.splitCharacters.includes("_")}
                        onChange={(e) => {
                            if (e.target.checked) {
                                addSplitChar("_");
                            } else {
                                removeSplitChar("_");
                            }
                        }}
                    />
                    <br />
                    <Checkbox
                        disabled={tokenOptions.characterSplit}
                        label=":"
                        checked={tokenOptions.splitCharacters.includes(":")}
                        onChange={(e) => {
                            if (e.target.checked) {
                                addSplitChar(":");
                            } else {
                                removeSplitChar(":");
                            }
                        }}
                    />
                    <br />
                    <h4>Other Options</h4>
                    <Checkbox
                        disabled={tokenOptions.characterSplit}
                        label="Split based on case"
                        checked={tokenOptions.splitOnCase}
                        onChange={(e) => {
                            setTokenOptions({
                                ...tokenOptions,
                                splitOnCase: e.target.checked,
                            });
                        }}
                    />
                    <br />
                    <Checkbox
                        label="Split on all Characters"
                        checked={tokenOptions.characterSplit}
                        onChange={(e) => {
                            setTokenOptions({
                                ...tokenOptions,
                                characterSplit: e.target.checked,
                            });
                        }}
                    />
                    <br />
                    <Input
                        type="number"
                        value={textOptionsTemp.minChecksPerGroup}
                        invalid={
                            isNaN(
                                parseInt(textOptionsTemp.minChecksPerGroup)
                            ) || parseInt(textOptionsTemp.minChecksPerGroup) < 2
                        }
                        min="2"
                        label="Min checks per group"
                        onChange={(e) => {
                            if (parseInt(e.target.value) >= 2) {
                                setOtherOptions({
                                    ...otherOptions,
                                    minChecksPerGroup: parseInt(e.target.value),
                                });
                            }
                            setTextOptionsTemp({
                                ...textOptionsTemp,
                                minChecksPerGroup: e.target.value,
                            });
                        }}
                    />
                    <br />
                    <Input
                        type="number"
                        value={textOptionsTemp.maxDepth}
                        invalid={
                            isNaN(parseInt(textOptionsTemp.maxDepth)) ||
                            parseInt(textOptionsTemp.maxDepth) < 0
                        }
                        min="0"
                        label="Max depth"
                        onChange={(e) => {
                            if (parseInt(e.target.value) >= 0) {
                                setOtherOptions({
                                    ...otherOptions,
                                    maxDepth: parseInt(e.target.value),
                                });
                            }
                            setTextOptionsTemp({
                                ...textOptionsTemp,
                                maxDepth: e.target.value,
                            });
                        }}
                    />
                    <br />
                    <Input
                        type="number"
                        value={textOptionsTemp.minTokenCount}
                        invalid={
                            isNaN(parseInt(textOptionsTemp.minTokenCount)) ||
                            parseInt(textOptionsTemp.minTokenCount) < 1
                        }
                        min="1"
                        label="Min Token Count"
                        onChange={(e) => {
                            if (parseInt(e.target.value) >= 0) {
                                setOtherOptions({
                                    ...otherOptions,
                                    minTokenCount: parseInt(e.target.value),
                                });
                            }
                            setTextOptionsTemp({
                                ...textOptionsTemp,
                                minTokenCount: e.target.value,
                            });
                        }}
                    />
                    <br />
                </div>
            </AnalysisGrid>
            <ButtonRow>
                <PrimaryButton
                    onClick={() => {
                        const customTracker = templateLocationTracker;
                        const customTrackerExport =
                            customTracker.exportDropdowns(randomUUID());
                        customTrackerExport.manifest.game =
                            connection.slotInfo.game;
                        customTrackerExport.manifest.name = `Template for ${connection.slotInfo.game} (${customTrackerExport.manifest.uuid.substring(0, 8)})`;
                        if (!customTracker || !customTrackerExport) {
                            NotificationManager.createToast({
                                message: "Failed to export and save tracker",
                                type: MessageType.error,
                            });
                            return;
                        }

                        customTrackerRepository.addTracker(customTrackerExport);
                        mainTrackerManager.setGameTracker(
                            connection.slotInfo.game,
                            {
                                type: ResourceType.locationTracker,
                                uuid: customTracker.manifest.uuid,
                                version: customTracker.manifest.version,
                            }
                        );
                        NotificationManager.createStatus({
                            message: "Successfully added tracker",
                            type: MessageType.success,
                            progress: 1,
                            duration: 3,
                        });
                    }}
                >
                    Save and Use
                </PrimaryButton>
                <SecondaryButton
                    onClick={() => {
                        const customTracker = templateLocationTracker;
                        const customTrackerExport =
                            customTracker.exportDropdowns(randomUUID());
                        customTrackerExport.manifest.game =
                            connection.slotInfo.game;
                        customTrackerExport.manifest.name = `Template for ${connection.slotInfo.game} (${customTrackerExport.manifest.uuid.substring(0, 8)})`;
                        if (!customTracker) {
                            NotificationManager.createToast({
                                message: "Failed to export tracker",
                                type: MessageType.error,
                            });
                            return;
                        }
                        exportJSONFile(
                            `tracker-export-${customTrackerExport.manifest.game}-${Date.now().toString()}`,
                            customTrackerExport
                        );
                    }}
                >
                    Export <Icon type="download" fontSize="14px" />
                </SecondaryButton>
                <GhostButton onClick={onClose}>Close</GhostButton>
            </ButtonRow>
        </Modal>
    );
};

export default NameAnalysisModal;
