import React from "react";
import { textPrimary } from "../../constants/colors";
import styled from "styled-components";

const SvgContainer = styled.svg<{ $animate: boolean }>`
    & circle {
        transform: rotate(-90deg);
        ${(props) => props.$animate && "animation: spin 1s linear infinite;"}
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;

const Spinner = ({
    size = 28,
    arc = 2,
    color = textPrimary,
    animate = true,
    ...props
}: {
    size?: number;
    arc?: number;
    color?: string;
    style?: React.CSSProperties;
    animate?: boolean;
}) => {
    const radius = size / 2 - 5;

    return (
        <SvgContainer
            $animate={animate}
            viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
            {...props}
        >
            <circle
                stroke={color}
                strokeDasharray={`${radius * arc} ${7 * radius}`}
                strokeOpacity={0.9}
                strokeWidth={5}
                r={radius}
                fill="none"
            />
        </SvgContainer>
    );
};

export default Spinner;
