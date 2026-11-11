import React, { useEffect, useState } from "react";
import styles from "./utility.module.css";
import { tertiary } from "@/constants/colors";
import { randomUUID } from "@/utility/uuid";
import { TextButton } from "@/components/shared/buttons";

class Tab {
    name: string;
    content: React.ReactNode;
    key: string;
    constructor(name: string, content: React.ReactNode) {
        this.name = name;
        this.content = content;
        this.key = randomUUID();
    }
}

const TabTab = ({
    name,
    selected,
    onClick,
}: {
    name: string;
    selected: boolean;
    onClick: React.MouseEventHandler;
}) => {
    return (
        <TextButton
            className={[
                styles.tab_container,
                selected ? styles.selected : "",
            ].join(" ")}
            onClick={onClick}
        >
            {name}
        </TextButton>
    );
};

const Tabs = ({
    tabs,
    style,
}: {
    tabs: Tab[];
    style?: React.CSSProperties;
}) => {
    const [selectedTabKey, setSelectedTabKey] = useState(
        tabs.length > 0 ? tabs[0].key : null
    );
    const tabMap = new Map(tabs.map((tab) => [tab.key, tab]));

    useEffect(() => {
        if (!selectedTabKey || !tabMap.has(selectedTabKey)) {
            setSelectedTabKey(tabs.length > 0 ? tabs[0].key : null);
        }
    }, [tabs]);

    return (
        <div
            style={{
                display: "grid",
                boxSizing: "border-box",
                gridTemplateRows: "2em 1fr",
                ...style,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    width: "100%",
                    height: "100%",
                    overflowX: "auto",
                    zIndex: "2",
                }}
            >
                {tabs.map((tab) => (
                    <TabTab
                        key={tab.key}
                        name={tab.name}
                        selected={tab.key === selectedTabKey}
                        onClick={() => {
                            setSelectedTabKey(tab.key);
                        }}
                    />
                ))}
            </div>
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "auto",
                }}
            >
                {selectedTabKey && tabMap.has(selectedTabKey) ? (
                    tabMap.get(selectedTabKey).content
                ) : (
                    <i color={tertiary}>
                        {tabs.length === 0 ? "No tab content" : "Select a tab"}
                    </i>
                )}
            </div>
        </div>
    );
};

export default Tabs;
export { Tab };
