// @ts-check
import React, { ComponentProps } from "react";
import { tertiary } from "../constants/colors";

const Input = ({
    label,
    style,
    invalid,
    ref,
    ...props
}: {
    label?: string;
    invalid?: boolean;
    style?: React.CSSProperties;
    ref?: React.Ref<HTMLInputElement>;
} & ComponentProps<"input">) => {
    return (
        <>
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
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
                        ref={ref}
                        {...props}
                        className="interactive"
                        style={{
                            backgroundColor: "var(--background-level-2)",
                            color: "var(--text-primary)",
                            border: `1px solid ${invalid ? "var(--danger-accent)" : tertiary}`,
                            width: "100%",
                            boxSizing: "border-box",
                        }}
                    />
                </div>
            </div>
        </>
    );
};

const Checkbox = ({
    label,
    checked,
    style,
    disabled,
    onChange,
    ref,
    ...props
}: {
    label: string;
    checked: boolean;
    disabled?: boolean;
    style?: React.CSSProperties;
    ref?: React.Ref<HTMLInputElement>;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}) => {
    return (
        <>
            <div
                style={{
                    ...style,
                    display: "inline-block",
                    textAlign: "left",
                }}
            >
                <input
                    ref={ref}
                    type="checkbox"
                    disabled={disabled}
                    {...props}
                    checked={checked}
                    onChange={onChange}
                />
                {label && (
                    <label
                        style={{
                            fontSize: "0.75em",
                            marginLeft: "0.5em",
                            marginBottom: "0px",
                            opacity: disabled ? "0.7" : "1",
                        }}
                    >
                        {label}
                    </label>
                )}
            </div>
        </>
    );
};
const FileInput = ({
    label,
    style,
    className,
    renderAsDrop,
    ref,
    ...props
}: {
    label?: string;
    style?: React.CSSProperties;
    renderAsDrop?: boolean;
    className?: string;
    ref?: React.Ref<HTMLInputElement>;
} & ComponentProps<"input">) => {
    return (
        <div>
            <label htmlFor={props.id}>{label}</label>
            <br />
            <input
                type="file"
                ref={ref}
                {...props}
                style={renderAsDrop ? { display: "none" } : style}
                className={renderAsDrop ? "" : "interactive " + className}
            />
            {renderAsDrop && (
                <div
                    onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.items) {
                            console.log("items");
                        } else {
                            console.log("files");
                        }
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                    }}
                >
                    Drag and drop file here.
                </div>
            )}
        </div>
    );
};
export { Input, Checkbox, FileInput };
