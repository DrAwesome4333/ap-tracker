import React, { useContext, useEffect, useState } from "react";
import Modal from "../shared/Modal";
import styled from "styled-components";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { GhostButton, PrimaryButton, SecondaryButton } from "../buttons";
import Icon from "../icons/icons";
import { LocationManager } from "../../services/locations/locationManager";
import { createEntranceManager } from "../../services/entrances/entranceManager";
import { TrackerManager } from "../../services/tracker/TrackerManager";
import ServiceContext from "../../contexts/serviceContext";
import { NameTokenizationOptions } from "../../services/tracker/generic/locationTrackerGenerators/locationName";
import { Checkbox, Input } from "../inputs";
import SectionView from "../sectionComponents/SectionView";
import { createTagManager } from "../../services/tags/tagManager";
import { genericGameRepository } from "../../services/tracker/generic/genericGame";
import { GenericGameMethod } from "../../services/tracker/generic/genericGameEnums";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import { CustomTrackerRepository } from "../../services/tracker/customTrackerManager";
import { exportJSONFile } from "../../utility/jsonExport";
import { InventoryManager } from "../../services/inventory/inventoryManager";
import { TempDataStore } from "../../services/dataStores";

interface AdditionalParams {
    useAllChecksInDataPackage?: boolean;
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

// const previewLocationManager = new LocationManager();
// const previewInventoryManager = new InventoryManager();
// const previewEntranceManager = createEntranceManager();
// const previewTagManager = createTagManager(previewLocationManager);
const previewTrackerDataStore = new TempDataStore();
const previewTrackerManager = new TrackerManager(previewTrackerDataStore);

const NameAnalysisModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const mainTrackerManager = services.trackerManager;

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
        useAllChecksInDataPackage: true,
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
        // const mainTrackerParams = mainTrackerManager.getTrackerInitParams();
        // if (
        //     mainTrackerParams &&
        //     previewTrackerManager.getTrackerInitParams()?.gameName !==
        //         mainTrackerParams.gameName &&
        //     open
        // ) {
        //     previewTrackerManager.initializeTracker(mainTrackerParams);
        //     previewLocationManager.pauseUpdateBroadcast();
        //     previewLocationManager.deleteAllLocations();
        //     mainTrackerParams.groups.location["Everywhere"].forEach(
        //         (location) => {
        //             previewLocationManager.updateLocationStatus(location, {
        //                 exists: true,
        //             });
        //         }
        //     );
        //     previewLocationManager.resumeUpdateBroadcast();
        // }
        // if (mainTrackerParams && open) {
        //     const tracker = buildGenericGame(
        //         mainTrackerParams.gameName,
        //         services.locationManager,
        //         services.inventoryManager,
        //         mainTrackerParams.groups,
        //         GenericGameMethod.nameAnalysis,
        //         {
        //             useAllChecksInDataPackage:
        //                 otherOptions.useAllChecksInDataPackage,
        //             tokenizationOptions: tokenOptions,
        //             groupingOptions: {
        //                 minGroupSize: otherOptions.minChecksPerGroup,
        //                 maxDepth: otherOptions.maxDepth,
        //                 minTokenCount: otherOptions.minTokenCount,
        //             },
        //         }
        //     );
        //     previewTrackerManager.setGameTracker(
        //         mainTrackerParams.gameName,
        //         tracker
        //     );
        // }
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
                    {/* <ServiceContext.Provider
                        value={{
                            locationManager:
                                otherOptions.useAllChecksInDataPackage
                                    ? previewLocationManager
                                    : previewLocationManager,
                            entranceManager: previewEntranceManager,
                            groupManager: previewGroupManager,
                            sectionManager: previewSectionManager,
                            tagManager: previewTagManager,
                            optionManager: services.optionManager,
                        }}
                    >
                        <SectionView name="root" context={{}} />
                    </ServiceContext.Provider> */}
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
                    <Checkbox
                        label="Use all checks in data package"
                        checked={otherOptions.useAllChecksInDataPackage}
                        onChange={(e) => {
                            setOtherOptions({
                                ...otherOptions,
                                useAllChecksInDataPackage: e.target.checked,
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
                    onClick={async () => {
                        const customTracker =
                            previewTrackerManager.getGameTracker(
                                services.connector.connection.slotInfo.game
                            );
                        const customTrackerExport =
                            customTracker.exportTracker();
                        if (!customTracker || !customTrackerExport) {
                            NotificationManager.createToast({
                                message: "Failed to export and save tracker",
                                type: MessageType.error,
                            });
                            return;
                        }

                        await CustomTrackerManager.addCustomTracker(
                            customTrackerExport
                        );
                        mainTrackerManager.setGameTracker(
                            customTracker.gameName,
                            customTrackerExport.id
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
                        const customTracker =
                            previewTrackerManager.getGameTracker(
                                services.connector.connection.slotInfo.game
                            );
                        if (!customTracker) {
                            NotificationManager.createToast({
                                message: "Failed to export tracker",
                                type: MessageType.error,
                            });
                            return;
                        }
                        exportJSONFile(
                            `tracker-export-${customTracker.gameName}-${Date.now().toString()}`,
                            customTracker.exportTracker()
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
