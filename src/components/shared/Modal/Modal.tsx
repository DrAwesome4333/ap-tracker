import React, { useContext } from "react";
import { createPortal } from "react-dom";
import styles from "./modal.module.css";
import { readThemeValue } from "../../../services/theme/theme";
import useOption from "../../../hooks/optionHook";
import ServiceContext from "../../../contexts/serviceContext";
import { globalOptionManager } from "../../../services/options/optionManager";
import apStyles from "../../sharedStyles/archipelago.module.css";
import { useAPColorStyles } from "../../../services/theme/ColorManager";

const Modal = ({
    open,
    header,
    footer,
    children,
}: {
    open: boolean;
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
}) => {
    const serviceContext = useContext(ServiceContext);
    const optionManger = serviceContext.optionManager ?? globalOptionManager;
    const themeValue = useOption(optionManger, "Theme:base", "global") as
        | "light"
        | "dark"
        | "system"
        | null;
    const apColors = useAPColorStyles(optionManger, "global");
    return (
        <>
            {open &&
                createPortal(
                    <div
                        className={["base", styles.modal_back_drop].join(" ")}
                        data-theme={readThemeValue(themeValue)}
                    >
                        <div
                            className={[
                                "base",
                                readThemeValue(themeValue),
                                styles.modal_wrapper,
                                apStyles.ap_color_wrapper,
                            ].join(" ")}
                            style={{ ...apColors }}
                        >
                            <div className={styles.modal_header}>{header}</div>
                            <div className={styles.modal_content}>
                                {children}
                            </div>
                            <div className={styles.modal_footer}>{footer}</div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default Modal;
