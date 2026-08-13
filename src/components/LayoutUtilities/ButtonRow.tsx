import React from "react";

const ButtonRow = ({
    children,
    padTop,
}: {
    children: React.ReactNode;
    padTop?: boolean;
}) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                marginTop: padTop ? "1em" : "0",
            }}
        >
            {children}
        </div>
    );
};

export default ButtonRow;
