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
            setSuggestionIndex(suggestionIndex - 1);
            buttonRefs.current[suggestionIndex - 1]?.focus();
        } else if (
            suggestionIndex < suggestions.length - 1 &&
            e.key === "ArrowDown"
        ) {
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
                {(suggestions.length > 0 || loading) && (
                    <div
                        style={{
                            position: "absolute",
                            width: "100%",
                            bottom: "100%",
                            maxHeight: "10vh",
                            overflow: "auto",
                            background: "var(--background-level-2)",
                            boxShadow: "var(--box-shadow)",
                        }}
                    >
                        {loading && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Spinner style={{ height: "18px" }} />
                            </div>
                        )}
                        {suggestions.slice(0, 50).map((s, index) => (
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
                                    }}
                                    onKeyDown={buttonOnKeyDown}
                                >
                                    {s.display ?? s.value}
                                </TextButton>
                            </div>
                        ))}
                        {suggestions.length > 100 && (
                            <div>
                                <i style={{ color: tertiary }}>
                                    Limit reached, search to refine results
                                </i>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export { TypeAhead };
