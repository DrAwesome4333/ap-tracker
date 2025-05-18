import styled from "styled-components";
import {
    filledTextPrimary,
    primary,
    secondary,
    danger,
    textPrimary,
    background,
} from "../constants/colors";

const BaseButton = styled.button.attrs({ className: "interactive" })<{
    $tiny?: boolean;
    $small?: boolean;
}>`
    border: none;
    padding: ${(props) =>
        props.$tiny
            ? "0.125rem 0.125rem"
            : props.$small
              ? "0.5rem 0.5rem"
              : "0.5rem 1.5rem"};
    margin: ${(props) => (props.$tiny ? "0rem 0.25rem" : "0.25rem 0.75rem")};
    font-size: ${(props) => (props.$tiny ? "0.5em" : "1em")};
    background-color: transparent;
`;

const PrimaryButton = styled(BaseButton)`
    color: ${filledTextPrimary};
    background-color: ${primary};
`;

const DangerButton = styled(BaseButton)`
    color: ${filledTextPrimary};
    background-color: ${danger};
`;

const SecondaryButton = styled(BaseButton)`
    color: ${filledTextPrimary};
    background-color: ${secondary};
`;

const GhostButton = styled(BaseButton)`
    color: ${textPrimary};
    background-color: ${background};
`;

export { PrimaryButton, DangerButton, SecondaryButton, GhostButton };
