import {
    useCallback,
    useContext,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import ServiceContext from "../../contexts/serviceContext";
import { PrimaryButton } from "../shared/buttons";
import { Input } from "../inputs";
import { useTextClientHistory } from "../../hooks/textClientHook";
import Spinner from "../icons/spinner";
import MultiWorldContext from "../../contexts/multiWorldContext";
import { autoComplete } from "./AutoComplete/AutoComplete";
import { TypeAhead } from "../shared/TypeAhead";

const TextClientTextBox = () => {
    const multiWorldContext = useContext(MultiWorldContext);
    const services = useContext(ServiceContext);
    const textClientManager = services.textClientManager;
    const inputHistory = useTextClientHistory(textClientManager);
    const [inputText, setInputText] = useState("");
    const [cachedInputText, setCachedInputText] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [predictions, setPredictions] = useState<string[]>([]);
    const [predictionsLoading, setPredictionsLoading] =
        useState<boolean>(false);
    const autoCompleteController = useRef<AbortController>(null);
    const processInput = () => {
        if (inputText && !sendingMessage) {
            setSendingMessage(true);
            textClientManager
                .processInput(inputText, services.connector.client)
                .finally(() => setSendingMessage(false));
            setInputText("");
            setCachedInputText("");
            setHistoryIndex(-1);
        }
    };

    const runAutoComplete = useCallback(
        (text: string) => {
            if (autoCompleteController.current) {
                autoCompleteController.current.abort();
            }
            const abortController = new AbortController();
            autoCompleteController.current = abortController;
            setPredictionsLoading(true);
            autoComplete(text, multiWorldContext, abortController.signal)
                .then((results) => {
                    if (!abortController.signal.aborted) {
                        setPredictions(results);
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
        },
        [inputText, multiWorldContext]
    );

    const navigateHistory = (direction: number) => {
        if (historyIndex === 0 && direction < 0) {
            // back to entry
            setInputText(cachedInputText);
        } else if (historyIndex === -1 && direction > 0) {
            // going from saved index to history
            setCachedInputText(inputText);
            if (inputHistory.length > 0) {
                setInputText(inputHistory[0]);
                setHistoryIndex(0);
            }
        } else if (historyIndex >= 0 && direction > 0) {
            if (inputHistory.length > historyIndex + 1) {
                setInputText(inputHistory[historyIndex + 1]);
                setHistoryIndex(historyIndex + 1);
            }
        } else if (historyIndex >= 0 && direction < 0) {
            if (0 < historyIndex) {
                setInputText(inputHistory[historyIndex - 1]);
                setHistoryIndex(historyIndex - 1);
            }
        }
    };
    return (
        <div style={{ display: "flex", padding: "0 0.5em 0.25em 0" }}>
            <PrimaryButton
                onClick={processInput}
                small
                disabled={sendingMessage}
            >
                {sendingMessage ? (
                    <Spinner style={{ height: "18px" }} />
                ) : (
                    "Send"
                )}
            </PrimaryButton>
            <TypeAhead
                loading={predictionsLoading}
                suggestions={predictions.map((value) => ({
                    value,
                    key: value,
                }))}
                label=""
                value={inputText}
                onSelect={(value: string) => {
                    setInputText(value);
                    setPredictions([]);
                }}
                style={{
                    flexGrow: 1,
                }}
                onChange={(e) => {
                    setInputText(e.target.value);
                    setHistoryIndex(-1);
                    runAutoComplete(e.target.value);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        processInput();
                        setPredictions([]);
                        autoCompleteController.current?.abort();
                    } else if (e.key === "ArrowUp") {
                        navigateHistory(1);
                    } else if (e.key === "ArrowDown") {
                        navigateHistory(-1);
                    }
                }}
            />
        </div>
    );
};
export default TextClientTextBox;
