import React from "react";
import styled from "styled-components";
import { primary, secondary, filledTextPrimary } from "../../constants/colors";
import { TextButton } from "../buttons";

const SavedConnectionContainer = styled(TextButton).attrs({
    className: "interactive",
})<{
    $selected?: boolean;
}>`
    box-sizing: border-box;
    width: 80%;
    justify-self: center;
    color: ${filledTextPrimary};
    background-color: ${(props) => (props.$selected ? primary : secondary)};
    margin: 0.5rem 0.75rem;
    padding: 0.5rem;
`;

const SavedConnectionView = ({
    name,
    connectionId,
    slot,
    host,
    port,
    game,
    lastUsedTime,
    selected,
    onClick,
    disabled,
}: {
    name: string;
    connectionId: string;
    playerAlias?: string;
    slot: string;
    host: string;
    port: string;
    game: string;
    createdTime: number;
    lastUsedTime: number;
    selected: boolean;
    onClick: (connectionId: string) => void;
    disabled: boolean;
}) => {
    return (
        <SavedConnectionContainer
            $selected={selected}
            disabled={disabled}
            onClick={() => onClick(connectionId)}
        >
            <div>{name}</div>
            <div>{game}</div>
            <div>
                {slot} {host}:{port}
            </div>
            <div>
                <i>
                    {new Date(lastUsedTime).toLocaleTimeString([], {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </i>
            </div>
        </SavedConnectionContainer>
    );
};

export default SavedConnectionView;
