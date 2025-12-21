import React, { useContext } from "react";
import { createPortal } from "react-dom";
import styles from "./modal.module.css";
import { readThemeValue } from "../../../services/theme/theme";
import useOption from "../../../hooks/optionHook";
import ServiceContext from "../../../contexts/serviceContext";
import { globalOptionManager } from "../../../services/options/optionManager";

/**
 *
 * @param param0
 * @param param0.open If true the modal will render
 * @returns
 */
const Modal = ({
    open,
    children,
}: {
    open: boolean;
    children: React.ReactNode;
}) => {
    const serviceContext = useContext(ServiceContext);
    const optionManger = serviceContext.optionManager ?? globalOptionManager;
    const themeValue = useOption(optionManger, "Theme:base", "global") as
        | "light"
        | "dark"
        | "system"
        | null;
    return (
        <>
            {open &&
                createPortal(
                    <div
                        className={styles.modal_back_drop}
                        data-theme={readThemeValue(themeValue)}
                    >
                        <div
                            className={[
                                "base",
                                readThemeValue(themeValue),
                                styles.modal_container,
                            ].join(" ")}
                        >
                            {children}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default Modal;
