import React from "react";
import buttonStyles from "./button.module.css";

const TextButton = ({
    children,
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) => {
    const styles = [className, buttonStyles.button_text];
    return (
        <button className={styles.filter((x) => x).join(" ")} {...props}>
            {children}
        </button>
    );
};

const ButtonFactory = (uniqueClass: string, name: string) => {
    const resultButton = ({
        children,
        tiny,
        small,
        className,
        ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        tiny?: boolean;
        small?: boolean;
    }) => {
        const styles = [className, buttonStyles.button_base, uniqueClass];
        if (tiny) {
            styles.push(buttonStyles.tiny_button);
        }
        if (small) {
            styles.push(buttonStyles.small_button);
        }
        return (
            <button className={styles.filter((x) => x).join(" ")} {...props}>
                {children}
            </button>
        );
    };
    resultButton.displayName = name;
    return resultButton;
};

const PrimaryButton = ButtonFactory(
    buttonStyles.button_primary,
    "PrimaryButton"
);
const SecondaryButton = ButtonFactory(
    buttonStyles.button_secondary,
    "SecondaryButton"
);
const GhostButton = ButtonFactory(buttonStyles.button_ghost, "GhostButton");
const DangerButton = ButtonFactory(buttonStyles.button_danger, "DangerButton");

export {
    PrimaryButton,
    DangerButton,
    SecondaryButton,
    GhostButton,
    TextButton,
};
