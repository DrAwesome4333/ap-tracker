// Based on https://jsfiddle.net/6j10L3x2/1/
import React, { createContext, useContext, useRef, useState } from "react";
import styles from "./utility.module.css";
const FlexContext: React.Context<"root" | "row" | "column"> =
    createContext("root");

const FlexItem = ({
    children,
    ratio,
    style,
    ref,
}: {
    children: React.ReactNode;
    ratio: number;
    style?: React.CSSProperties;
    ref?: React.Ref<HTMLDivElement>;
}) => {
    const myStyle = {
        "--flex-ratio": `${Math.floor(ratio * 100)}%`,
        ...style,
    };
    return (
        <div
            ref={ref}
            className={styles.flex_item}
            style={myStyle as React.CSSProperties}
        >
            {children}
        </div>
    );
};
const FlexResizer = ({
    onMouseDown,
    onTouchStart,
}: {
    onMouseDown: React.MouseEventHandler;
    onTouchStart: React.TouchEventHandler;
}) => {
    const flexParent = useContext(FlexContext);
    return (
        <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={[styles.flex_resizer, styles[flexParent]].join(" ")}
        ></div>
    );
};

const Flex = ({
    direction,
    child1,
    child2,
    startRatio,
    style,
}: {
    direction: "row" | "column";
    child1: React.ReactNode;
    child2: React.ReactNode;
    startRatio?: number;
    style?: React.CSSProperties;
}) => {
    const flexParent = useContext(FlexContext);
    const child1Ref: React.Ref<HTMLDivElement> = useRef(null);
    const child2Ref: React.Ref<HTMLDivElement> = useRef(null);
    const [childRatio, setChildRatio] = useState(startRatio ?? 0.5);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const mouseDownRef = useRef(false);

    const classes = [styles.flex, styles[direction]];

    const onMouseMove: React.MouseEventHandler = (event) => {
        if (mouseDownRef.current) {
            //
            const deltaX = event.clientX - mousePosRef.current.x;
            const deltaY = event.clientY - mousePosRef.current.y;
            mousePosRef.current = {
                x: event.clientX,
                y: event.clientY,
            };

            const totalWidth =
                child1Ref.current.clientWidth + child2Ref.current.clientWidth;
            const totalHeight =
                child1Ref.current.clientHeight + child2Ref.current.clientHeight;
            const ratioDX = deltaX / totalWidth;
            const ratioDY = deltaY / totalHeight;
            if (direction === "row") {
                setChildRatio((r) => Math.max(0, Math.min(1, r + ratioDX)));
            } else {
                setChildRatio((r) => Math.max(0, Math.min(1, r + ratioDY)));
            }
        }
    };

    const onTouchMove: React.TouchEventHandler = (event) => {
        if (mouseDownRef.current) {
            //
            const deltaX =
                event.targetTouches[0].clientX - mousePosRef.current.x;
            const deltaY =
                event.targetTouches[0].clientY - mousePosRef.current.y;
            mousePosRef.current = {
                x: event.targetTouches[0].clientX,
                y: event.targetTouches[0].clientY,
            };

            const totalWidth =
                child1Ref.current.clientWidth + child2Ref.current.clientWidth;
            const totalHeight =
                child1Ref.current.clientHeight + child2Ref.current.clientHeight;
            const ratioDX = deltaX / totalWidth;
            const ratioDY = deltaY / totalHeight;
            if (direction === "row") {
                setChildRatio((r) => Math.max(0, Math.min(1, r + ratioDX)));
            } else {
                setChildRatio((r) => Math.max(0, Math.min(1, r + ratioDY)));
            }
        }
    };

    if (flexParent !== "root") {
        classes.push(styles.child);
    }
    return (
        <FlexContext.Provider value={direction}>
            <div
                className={classes.join(" ")}
                style={style}
                onMouseUp={(event) => {
                    mouseDownRef.current = false;
                    event.preventDefault();
                }}
                onTouchEnd={(_event) => {
                    mouseDownRef.current = false;
                }}
                onMouseMove={onMouseMove}
                onTouchMove={onTouchMove}
            >
                <FlexItem ref={child1Ref} ratio={childRatio}>
                    {child1}
                </FlexItem>
                <FlexResizer
                    onMouseDown={(event) => {
                        mousePosRef.current = {
                            x: event.clientX,
                            y: event.clientY,
                        };
                        mouseDownRef.current = true;
                        event.preventDefault();
                    }}
                    onTouchStart={(event) => {
                        mousePosRef.current = {
                            x: event.targetTouches[0].clientX,
                            y: event.targetTouches[0].clientY,
                        };
                        mouseDownRef.current = true;
                    }}
                />
                <FlexItem ref={child2Ref} ratio={1 - childRatio}>
                    {child2}
                </FlexItem>
            </div>
        </FlexContext.Provider>
    );
};

export default Flex;
