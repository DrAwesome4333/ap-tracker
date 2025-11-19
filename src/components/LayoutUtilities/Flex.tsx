// Based on https://jsfiddle.net/6j10L3x2/1/
import React, {
    createContext,
    useContext,
    forwardRef,
    useRef,
    useState,
} from "react";
const FlexContext: React.Context<"root" | "row" | "column"> =
    createContext("root");

const FlexItem = forwardRef(
    (
        {
            children,
            ratio,
            style,
        }: {
            children: React.ReactNode;
            ratio: number;
            style?: React.CSSProperties;
        },
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const myStyle: React.CSSProperties = {
            overflow: "hidden",
            flex: `1 1 ${Math.floor(ratio * 100)}%`,
            ...style,
        };
        return (
            <div ref={ref} style={myStyle}>
                {children}
            </div>
        );
    }
);
FlexItem.displayName = "FlexItem";

const FlexResizer = ({
    onMouseDown,
    onTouchStart,
}: {
    onMouseDown: React.MouseEventHandler;
    onTouchStart: React.TouchEventHandler;
}) => {
    const flexParent = useContext(FlexContext);
    const style: React.CSSProperties = {
        flex: "0 0 0.5em",
        cursor: flexParent === "row" ? "ew-resize" : "ns-resize",
        backgroundColor: "rgba(128, 128, 128, 0.5)",
    };
    return (
        <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            style={style}
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
    const child1Ref: React.ForwardedRef<HTMLDivElement> = useRef(null);
    const child2Ref: React.ForwardedRef<HTMLDivElement> = useRef(null);
    const [childRatio, setChildRatio] = useState(startRatio ?? 0.5);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const mouseDownRef = useRef(false);

    const myStyle: React.CSSProperties = {
        display: "flex",
        gap: "0.25em",
        flexDirection: direction,
        ...style,
    };

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
        myStyle.position = "relative";
        myStyle.width = "100%";
        myStyle.height = "100%";
    }
    return (
        <FlexContext.Provider value={direction}>
            <div
                style={myStyle}
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
