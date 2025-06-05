import React, { useContext } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { background, textPrimary } from "../../constants/colors";
import { readThemeValue } from "../../services/theme/theme";
import useOption from "../../hooks/optionHook";
import ServiceContext from "../../contexts/serviceContext";
import { globalOptionManager } from "../../services/options/optionManager";

const BackDrop = styled.div`
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10;
`;

const Container = styled.div`
    position: fixed;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    margin: auto;
    width: fit-content;
    height: fit-content;
    padding: 2rem;
    background-color: ${background};
    color: ${textPrimary};
    border: 0px solid black;
    pointer-events: all;
    box-shadow: 4px 8px 0px rgba(0, 0, 0, 0.5);
    z-index: 11;
`;
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
                    <BackDrop data-theme={readThemeValue(themeValue)}>
                        <Container className="App">{children}</Container>
                    </BackDrop>,
                    document.body
                )}
        </>
    );
};

export default Modal;
