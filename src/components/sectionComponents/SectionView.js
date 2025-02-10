// @ts-check
import React, { useContext, useState, useSyncExternalStore } from "react";
import CheckView from "./CheckView";
import ServiceContext from "../../contexts/serviceContext";
import Icon from "../icons/icons";
import useOption from "../../hooks/optionHook";

/**
 * @typedef Condition
 * @prop {string} [option]
 * @prop {Condition} [not]
 * @prop {string} [state]
 * @prop {*} [is]
 * @prop {Condition} [and]
 * @prop {Condition} [or]
 */

/**
 *
 * @param {Object} options
 * @param {string} options.name
 * @param {*} options.context
 * @param {boolean} [options.startOpen]
 * @returns
 */
const SectionView = ({ name, context, startOpen }) => {
    const isClosable = name !== "root";
    const [isOpen, setIsOpen] = useState(
        isClosable ? startOpen ?? false : true
    );
    const serviceContext = useContext(ServiceContext);
    const sectionManager = serviceContext.sectionManager;
    const tagManager = serviceContext.tagManager;
    const optionManager = serviceContext.optionManager;
    if (!sectionManager) {
        throw new Error("No group context provided");
    }
    if (!optionManager) {
        throw new Error("No option manager provided");
    }
    const section = useSyncExternalStore(
        sectionManager.getSubscriberCallback(name),
        () => sectionManager.getSectionStatus(name),
        () => sectionManager.getSectionStatus(name)
    );
    const style = {
        borderLeft: `2px dashed ${section?.theme.color ?? "Black"}`,
        paddingLeft: "0.5em",
        marginLeft: "0.5em",
        minWidth: "30em",
    };

    const clearedCheckCount =
        (section?.checkReport.checked.size ?? 0) +
        (section?.checkReport.ignored.size ?? 0);
    const totalCheckCount = section?.checkReport.exist.size ?? 0;
    const checkedLocationBehavior_ = useOption(
        optionManager,
        "checkedLocationBehavior",
        "global"
    );
    const checkedLocationBehavior = checkedLocationBehavior_ ?? "nothing";

    const clearedSectionBehavior_ = useOption(
        optionManager,
        "clearedSectionBehavior",
        "global"
    );
    const clearedSectionBehavior = clearedSectionBehavior_ ?? "nothing";

    return (
        <>
            {section?.checkReport.exist.size === 0 ? ( 
                <></> // Hide empty sections
            ) : (
                <div style={style}>
                    <h3
                        style={{ cursor: isClosable ? "pointer" : "default" }}
                        className={`section_title ${
                            section?.checkReport.checked.size ===
                            section?.checkReport.exist.size
                                ? "checked"
                                : ""
                        }`}
                        onClick={() => {
                            if (isClosable) {
                                setIsOpen(!isOpen);
                            }
                        }}
                    >
                        {section?.title ?? "Unloaded Section"}{" "}
                        <i>
                            {clearedCheckCount}
                            {"/"}
                            {totalCheckCount}
                        </i>{" "}
                        {[...(section?.checkReport.tagCounts ?? [])].map(
                            ([id, values]) => {
                                const counterType = tagManager?.getCounter(id);
                                return (
                                    <i
                                        key={id}
                                        style={{ color: counterType?.color }}
                                        title={counterType?.displayName}
                                    >
                                        {counterType?.icon && (
                                            <Icon
                                                fontSize="14px"
                                                type={counterType.icon}
                                            />
                                        )}
                                        {values.size}
                                        {counterType?.showTotal &&
                                            `/${
                                                section?.checkReport.tagTotals.get(
                                                    id
                                                )?.size ?? 0
                                            }`}
                                    </i>
                                );
                            }
                        )}
                        {isClosable ? (isOpen ? " ▲ " : " ▼ ") : ""}
                    </h3>
                    {isOpen && (
                        <>
                            <div>
                                {[...(section?.checks.keys() ?? [])].map(
                                    (check) =>
                                        check &&
                                        (!section?.checks.get(check)?.checked ||
                                            checkedLocationBehavior ===
                                                "nothing") && (
                                            <CheckView
                                                check={check}
                                                key={check}
                                            />
                                        )
                                )}
                            </div>
                            {checkedLocationBehavior === "separate" && (
                                <div>
                                    {[...(section?.checks.keys() ?? [])].map(
                                        (check) =>
                                            check &&
                                            section?.checks.get(check)
                                                ?.checked && (
                                                <CheckView
                                                    check={check}
                                                    key={check}
                                                />
                                            )
                                    )}
                                </div>
                            )}
                            {section?.children &&
                                section.children.map((childName) => {
                                    let child =
                                        sectionManager.getSectionStatus(
                                            childName
                                        );
                                    if (
                                        child &&
                                        (clearedSectionBehavior === "nothing" ||
                                            ((clearedSectionBehavior ===
                                                "hide" ||
                                                clearedSectionBehavior ===
                                                    "separate") &&
                                                child.checkReport.checked
                                                    .size !==
                                                    child.checkReport.exist
                                                        .size))
                                    ) {
                                        return (
                                            <SectionView
                                                name={childName}
                                                context={context}
                                                key={childName}
                                                startOpen={startOpen}
                                            />
                                        );
                                    }
                                    return <></>;
                                })}
                            {clearedSectionBehavior === "separate" &&
                                section?.children &&
                                section.children.map((childName) => {
                                    let child =
                                        sectionManager.getSectionStatus(
                                            childName
                                        );
                                    if (
                                        child &&
                                        child.checkReport.checked.size ===
                                            child.checkReport.exist.size
                                    ) {
                                        return (
                                            <SectionView
                                                name={childName}
                                                context={context}
                                                key={childName}
                                                startOpen={startOpen}
                                            />
                                        );
                                    }
                                    return <></>;
                                })}
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default SectionView;
