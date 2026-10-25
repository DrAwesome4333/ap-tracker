import {
    ChangeEventHandler,
    ComponentProps,
    KeyboardEventHandler,
    ReactNode,
    useId,
    useRef,
    useState,
} from "react";
import { tertiary } from "../../constants/colors";
import { TextButton } from "./buttons";
import Spinner from "../icons/spinner";

type TypeAheadSuggestion = {
    display?: ReactNode;
    value: string;
    key: React.Key;
};

type TypeAheadProps = {
    suggestions: TypeAheadSuggestion[];
    onSelect: (value: string) => void;
    label?: string;
    style?: React.CSSProperties;
    invalid?: boolean;
    ref?: React.Ref<HTMLInputElement>;
    loading?: boolean;
} & Omit<ComponentProps<"input">, "type" | "onSelect">;

const suggestionCap = 100;

/**
 * Textbox with suggestions
 * @param param0
 * @returns
 */
const TypeAhead = ({
    ref,
    loading,
    suggestions,
    label,
    style,
    invalid,
    onSelect,
    onChange: parentOnChange,
    onKeyDown: parentOnKeyDown,
    ...props
}: TypeAheadProps) => {
    const buttonRefs = useRef<HTMLButtonElement[]>([]);
    const inputId = useId();
    const [previousSuggestions, setPreviousSuggestions] =
        useState<TypeAheadSuggestion[]>();
    const [suggestionIndex, setSuggestionIndex] = useState<number>(-1);
    const [hasFocus, setHasFocus] = useState(false);
    const showSuggestions = (suggestions.length > 0 || loading) && hasFocus;
    const containerRef = useRef<HTMLDivElement>(null);

    if (previousSuggestions !== suggestions) {
        setPreviousSuggestions(suggestions);
        buttonRefs.current = [];
        setSuggestionIndex(-1);
    }

    const onChange: ChangeEventHandler<HTMLInputElement, HTMLInputElement> = (
        e
    ) => {
        parentOnChange(e);
        setSuggestionIndex(-1);
    };

    const textBoxOnKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (suggestionIndex === -1) {
            if (suggestions.length > 0 && e.key === "ArrowUp") {
                setSuggestionIndex(0);
                buttonRefs.current?.[0]?.focus();
                e.preventDefault();
            } else {
                parentOnKeyDown(e);
            }
        }
    };

    const buttonOnKeyDown: KeyboardEventHandler<HTMLButtonElement> = (e) => {
        if (suggestionIndex > 0 && e.key === "ArrowUp") {
            e.preventDefault();
            setSuggestionIndex(suggestionIndex - 1);
            buttonRefs.current[suggestionIndex - 1]?.focus();
        } else if (
            suggestionIndex < Math.min(suggestions.length, suggestionCap) - 1 &&
            e.key === "ArrowDown"
        ) {
            e.preventDefault();
            setSuggestionIndex(suggestionIndex + 1);
            buttonRefs.current[suggestionIndex + 1]?.focus();
        }
    };

    return (
        <>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                    ...style,
                }}
                ref={containerRef}
                onBlur={() => {
                    requestAnimationFrame(() => {
                        if (
                            !containerRef.current?.contains(
                                document.activeElement
                            )
                        ) {
                            setHasFocus(false);
                        }
                    });
                }}
                onFocus={() => {
                    setHasFocus(true);
                }}
            >
                <div
                    style={{
                        width: "100%",
                    }}
                >
                    {label && (
                        <>
                            <label
                                style={{
                                    fontSize: "0.75em",
                                    marginLeft: "0.5em",
                                    marginBottom: "0px",
                                    color: invalid
                                        ? "var(--danger-accent)"
                                        : "var(--text-primary)",
                                }}
                            >
                                {label} {invalid && "*"}
                            </label>
                            <br />
                        </>
                    )}

                    <input
                        id={inputId}
                        ref={ref}
                        {...props}
                        type={"text"}
                        className="interactive"
                        onChange={onChange}
                        onKeyDown={textBoxOnKeyDown}
                        style={{
                            backgroundColor: "var(--background-level-2)",
                            color: "var(--text-primary)",
                            border: `1px solid ${invalid ? "var(--danger-accent)" : tertiary}`,
                            width: "100%",
                            boxSizing: "border-box",
                        }}
                    />
                </div>
                {showSuggestions && (
                    <div
                        style={{
                            position: "absolute",
                            width: "100%",
                            bottom: "calc(100% + 0.5em)",
                            maxHeight: "10vh",
                            minHeight: "24px",
                            background: "var(--background-level-2)",
                            boxShadow: "var(--box-shadow)",
                        }}
                    >
                        {loading && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                    height: "100%",
                                    position: "absolute",
                                    backdropFilter: "blur(2px)",
                                }}
                            >
                                <Spinner style={{ height: "24px" }} />
                            </div>
                        )}
                        <div style={{ overflow: "auto", maxHeight: "10vh" }}>
                            {suggestions
                                .slice(0, suggestionCap)
                                .map((s, index) => (
                                    <div key={s.key}>
                                        <TextButton
                                            ref={(element) => {
                                                buttonRefs.current[index] =
                                                    element ?? null;
                                            }}
                                            onClick={() => {
                                                onSelect?.(s.value);
                                                document
                                                    .getElementById(inputId)
                                                    ?.focus();
                                                setSuggestionIndex(-1);
                                            }}
                                            onKeyDown={buttonOnKeyDown}
                                            style={{
                                                width: "100%",
                                                borderBottom:
                                                    "1px solid var(--background-level-0)",
                                            }}
                                        >
                                            {s.display ?? s.value}
                                        </TextButton>
                                    </div>
                                ))}
                            {suggestions.length > suggestionCap && (
                                <div>
                                    <i style={{ color: tertiary }}>
                                        Limit reached, search to refine results
                                    </i>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export { TypeAhead };
