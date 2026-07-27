import React, {
    useContext,
    useEffect,
    useEffectEvent,
    useRef,
    useState,
} from "react";
import Modal from "../../shared/Modal";
import styles from "./NameAnalysis.module.css";
import ButtonRow from "../../LayoutUtilities/ButtonRow";
import {
    GhostButton,
    PrimaryButton,
    SecondaryButton,
} from "../../shared/buttons";
import Icon from "../../icons/icons";
import ServiceContext from "../../../contexts/serviceContext";
import { NameTokenizationOptions } from "../../../services/tracker/generic/locationTrackerGenerators/locationName";
import { Checkbox, Input } from "../../inputs";
import SectionView from "../../LocationTrackerViews/DropDownViewComponents/SectionView";
import { TagManager } from "../../../services/tags/tagManager";
import { GenericGameMethod } from "../../../services/tracker/generic/genericGameEnums";
import NotificationManager, {
    MessageType,
} from "../../../services/notifications/notifications";
import { exportJSONFile } from "../../../utility/jsonExport";
import { ResourceType } from "../../../services/tracker/resourceEnums";
import TemplateLocationTracker from "../../../services/tracker/generic/templateTracker";
import { randomUUID } from "../../../utility/uuid";
import ItemRepository from "../../../services/items/itemRepository";
import useCurrentMultiworldSlot from "../../../hooks/useCurrentMultiworldSlot";
import LocationRepository from "../../../services/locations/locationRepository";
import SlotContext from "../../../contexts/slotContext";
import MultiWorldService from "../../../services/MultiInfo/MultiWorldService";
import DataPackageHelper from "../../../services/MultiInfo/DatapackageHelper";
import { GamePackageWrapper } from "../../../services/gamepackage/GamePackageWrapper";
import TemplateLocationSource from "../../../services/tracker/generic/locationTrackerGenerators/templateLocationSource";

interface AdditionalParams {
    minChecksPerGroup?: number;
    minTokenCount?: number;
    maxDepth?: number;
}

const previewTagManager = new TagManager();

const NameAnalysisModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const mainTrackerManager = services.trackerManager;
    const slot = useCurrentMultiworldSlot();
    const customTrackerRepository = services.customTrackerRepository;

    const [locationRepository, setLocationRepository] =
        useState<LocationRepository>(null);
    const [templateLocationTracker, setTemplateLocationTracker] =
        useState<TemplateLocationTracker>(null);
    const [gamePackage, setGamePackage] = useState<GamePackageWrapper>(null);

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
        return cachedPackage;
    };

    const resetTemplateRepository = useEffectEvent(async () => {
        const dataPackage = await loadDataPackage();
        const newLocationRepository = new LocationRepository();
        const packageWrapper = dataPackage
            ? new GamePackageWrapper(dataPackage, slot.game)
            : null;
        if (packageWrapper) {
            const locationSource = new TemplateLocationSource(packageWrapper);
            newLocationRepository.addSource(locationSource);
        }
        setLocationRepository(newLocationRepository);
        setGamePackage(packageWrapper);
    });

    const resetTemplate = useEffectEvent(() => {
        if (open && gamePackage) {
            const newTemplateLocationTracker = new TemplateLocationTracker(
                gamePackage
            );
            newTemplateLocationTracker.configure(
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
            setTemplateLocationTracker(newTemplateLocationTracker);
        }
    });

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
        resetTemplateRepository();
    }, [slot]);

    useEffect(() => {
        resetTemplate();
    }, [mainTrackerManager, tokenOptions, otherOptions, open, gamePackage]);

    return (
        <Modal
            open={open}
            header={<h3>Name Analysis</h3>}
            footer={
                <ButtonRow>
                    <PrimaryButton
                        onClick={() => {
                            const customTracker = templateLocationTracker;
                            const customTrackerExport =
                                customTracker.exportDropdowns(randomUUID());
                            customTrackerExport.manifest.game = slot.game;
                            customTrackerExport.manifest.name = `Template for ${slot.game} (${customTrackerExport.manifest.uuid.substring(0, 8)})`;
                            if (!customTracker || !customTrackerExport) {
                                NotificationManager.createToast({
                                    message:
                                        "Failed to export and save tracker",
                                    type: MessageType.error,
                                });
                                return;
                            }

                            customTrackerRepository.addTracker(
                                customTrackerExport
                            );
                            mainTrackerManager.setGameTracker(slot.game, {
                                type: ResourceType.locationTracker,
                                uuid: customTrackerExport.manifest.uuid,
                                version: customTrackerExport.manifest.version,
                            });
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
                            customTrackerExport.manifest.game = slot.game;
                            customTrackerExport.manifest.name = `Template for ${slot.game} (${customTrackerExport.manifest.uuid.substring(0, 8)})`;
                            if (!customTracker) {
                                NotificationManager.createToast({
                                    message: "Failed to export tracker",
                                    type: MessageType.error,
                                });
                                return;
                            }
                            exportJSONFile(
                                `tracker-export-${customTrackerExport.manifest.game.replace(/\s/g, "")}-${customTrackerExport.manifest.uuid.substring(0, 8)}`,
                                customTrackerExport
                            );
                            onClose();
                        }}
                    >
                        Export <Icon type="download" fontSize="14px" />
                    </SecondaryButton>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            }
        >
            <div className={styles.analysis_grid}>
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
                            optionManager: services.optionManager,
                        }}
                    >
                        <SlotContext.Provider
                            value={{
                                slotName: "Example Slot Name",
                                slotAlias: "Example Slot Alias",
                                tagManager: previewTagManager,
                                locationTracker: templateLocationTracker,
                                locationRepository: locationRepository,
                                liveSlot: false,
                            }}
                        >
                            <SectionView name="root" />
                        </SlotContext.Provider>
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
            </div>
        </Modal>
    );
};

export default NameAnalysisModal;
