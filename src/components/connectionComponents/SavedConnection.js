// @ts-check
import React from "react";
import styled from "styled-components";
import { secondary, tertiary } from "../../constants/colors";

const SavedConnectionContainer = styled.div`
    box-sizing: border-box;
    width: 25vw;
    cursor: ${(props) =>
        // @ts-ignore
        props.$disabled ? "not-allowed" : "pointer"};
    opacity: ${(props) =>
        // @ts-ignore
        props.$disabled ? 0.5 : 1};
    background-color: ${(props) =>
        // @ts-ignore
        props.$selected ? secondary : tertiary};
    border-radius: 5px;
    margin: 0.5rem;
    padding: 0.5rem;
`;

const SavedConnection = ({
    name,
    connectionId,
    playerAlias,
    slot,
    host,
    port,
    createdTime,
    lastUsedTime,
    selected,
    onClick,
    disabled,
    ...props
}) => {
    return (
        <SavedConnectionContainer
            // @ts-ignore don't know how to jsdoc it properly
            $selected={selected}
            $disabled={disabled}
            onClick={() => onClick(connectionId)}
        >
            <div>{name}</div>
            <div>{playerAlias}</div>
            <div>
                {slot}@{host}:{port}
            </div>
            <div>
                <i>
                    Created:{" "}
                    {new Date(createdTime).toLocaleTimeString([], {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </i>
            </div>
            <div>
                <i>
                    Last Used:{" "}
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

export default SavedConnection;