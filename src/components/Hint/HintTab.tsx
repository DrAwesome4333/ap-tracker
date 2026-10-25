import { useCallback, useContext, useId, useRef, useState } from "react";
import PanelHeader from "../shared/PanelHeader";
import HintTable from "./HintTable";
import ServiceContext from "../../contexts/serviceContext";
import useOption from "../../hooks/optionHook";
import HintFilterModal from "./HintFilterModal";
import { PrimaryButton } from "../shared/buttons";
import Icon from "../icons/icons";
import { HintFilter, optionScope } from "./HintOptionDef";
import { Input } from "../inputs";
import MultiWorldContext, {
    MultiWorldConnectionMode,
} from "../../contexts/multiWorldContext";
import { hintAutoComplete } from "../../services/AutoComplete/AutoComplete";
import { MultiWorldContextHelper } from "../../services/MultiInfo/MultiWorldContextData";
import { TypeAhead } from "../shared/TypeAhead";
import useRoomOptions from "../../hooks/roomOptionsHook";
import useHintPoints from "../../hooks/hintPointsHook";
import Spinner from "../icons/spinner";

const HintTab = () => {
    const services = useContext(ServiceContext);
    const multiWorldContext = useContext(MultiWorldContext);
    const textClientManager = services.textClientManager;
    const roomOptions = useRoomOptions();
    const hintPoints = useHintPoints();
    const filters: HintFilter = useOption(
        services.optionManager,
        "HintTabFilters",
        optionScope
    ) as HintFilter;
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [searchKey, setSearchKey] = useState("");
    const [searchFilterMode, setSearchFilterMode] = useState("location");
    const dropdownId = useId();
    const showNewHintSection =
        multiWorldContext.trackedSlot !== undefined &&
        textClientManager &&
        multiWorldContext.connectionMode === MultiWorldConnectionMode.Server;
    const [hintInputText, setHintInputText] = useState("");
    const [hintSending, setHintSending] = useState(false);
    const [hintPredictions, setHintPredictions] = useState<string[]>([]);
    const predictionAbortController = useRef<AbortController>(null);
    const [predictionsLoading, setPredictionsLoading] =
        useState<boolean>(false);

    const sendHint = () => {
        if (
            textClientManager &&
            services.connector &&
            hintInputText &&
            !hintSending
        ) {
            setHintSending(true);
            textClientManager
                .processInput(
                    `!hint ${hintInputText}`,
                    services.connector.client
                )
                .finally(() => setHintSending(false));
            setHintInputText("");
            setHintPredictions([]);
            setPredictionsLoading(false);
            predictionAbortController?.current.abort();
        }
    };

    const predictHint = (text: string) => {
        if (predictionAbortController.current) {
            predictionAbortController.current.abort();
        }
        if (!text) {
            setPredictionsLoading(false);
            setHintPredictions([]);
            return;
        }
        const abortController = new AbortController();
        predictionAbortController.current = abortController;
        setPredictionsLoading(true);
        hintAutoComplete(
            text,
            MultiWorldContextHelper.getSlotGame(
                multiWorldContext,
                multiWorldContext.trackedSlot
            ),
            multiWorldContext,
            abortController.signal
        )
            .then((results) => {
                if (!abortController.signal.aborted) {
                    setHintPredictions(results);
                }
            })
            .catch((e) => {
                if (
                    e.message !== "Aborted" &&
                    !abortController.signal.aborted
                ) {
                    console.error(e);
                }
            })
            .finally(() => {
                if (!abortController.signal.aborted) {
                    setPredictionsLoading(false);
                }
            });
    };

    const availableHintCount = !roomOptions
        ? 0
        : roomOptions?.hintCost
          ? Math.floor(hintPoints / roomOptions.hintCost)
          : 1;

    return (
        <div
            style={{
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                display: "grid",
                gap: "0.25em",
                gridTemplateRows: "3em 1fr 3em",
                overflow: "hidden",
            }}
        >
            <PanelHeader title="Hints">
                <Input
                    type="search"
                    label="Search"
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                />
                <label htmlFor={dropdownId}>Filter on:</label>
                <select
                    id={dropdownId}
                    value={searchFilterMode}
                    onChange={(e) => {
                        setSearchFilterMode(e.target.value);
                    }}
                >
                    <option value="location">Locations</option>
                    <option value="item">Items</option>
                </select>
                <PrimaryButton
                    tiny
                    style={{ height: "20px" }}
                    onClick={() => setShowFilterModal(true)}
                >
                    <Icon fontSize="12pt" type="filter_alt" />
                </PrimaryButton>
            </PanelHeader>
            <HintTable
                filters={filters}
                searchKey={searchKey}
                searchFilterMode={searchFilterMode}
            />
            {showNewHintSection && (
                <div
                    style={{
                        display: "flex",
                        padding: "0 0.5em 0.25em 0",
                        alignItems: "center",
                    }}
                >
                    <PrimaryButton
                        small
                        onClick={sendHint}
                        disabled={availableHintCount < 1 || hintSending}
                    >
                        {hintSending ? (
                            <Spinner style={{ height: "18px" }} />
                        ) : (
                            "Hint"
                        )}
                    </PrimaryButton>
                    <TypeAhead
                        style={{
                            flexGrow: 1,
                        }}
                        loading={predictionsLoading}
                        suggestions={hintPredictions.map((value) => ({
                            value,
                            key: value,
                        }))}
                        value={hintInputText}
                        onSelect={(value) => {
                            setHintInputText(value);
                            setPredictionsLoading(false);
                            setHintPredictions([]);
                            predictionAbortController.current?.abort();
                        }}
                        onChange={(e) => {
                            setHintInputText(e.target.value);
                            predictHint(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                sendHint();
                            }
                        }}
                    />
                    <div
                        style={{
                            textAlign: "center",
                            paddingLeft: "0.5em",
                        }}
                    >
                        {" "}
                        {roomOptions?.hintCost > 0 ? (
                            <div>
                                {Math.max(availableHintCount, 0)}
                                <br /> available
                            </div>
                        ) : (
                            "Free"
                        )}{" "}
                    </div>
                </div>
            )}
            <HintFilterModal
                open={showFilterModal}
                onClose={() => setShowFilterModal(false)}
            />
        </div>
    );
};

export default HintTab;
