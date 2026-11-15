import React from "react";
import utility_styles from "./utility.module.css";

const ButtonRow = ({ children }: { children: React.ReactNode }) => {
    return <div className={utility_styles.button_row}>{children}</div>;
};

export default ButtonRow;
