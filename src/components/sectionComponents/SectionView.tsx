// @ts-check
import React, { useContext, useMemo, useState } from "react";
import LocationView from "./LocationView";
import ServiceContext from "../../contexts/serviceContext";
import Icon from "../icons/icons";
import useOption from "../../hooks/optionHook";
import { naturalSort } from "../../utility/comparisons";
import { globalOptionManager } from "../../services/options/optionManager";
import { useSection } from "../../hooks/sectionHooks";
import LargeList, { RowGenerator } from "../LayoutUtilities/LargeList";

globalOptionManager.setOptionDefault(
    "checkedLocationBehavior",
    "global",
    "nothing"
);

globalOptionManager.setOptionDefault(
    "checkedSectionBehavior",
    "global",
    "nothing"
);

globalOptionManager.setOptionDefault("checkOrderBehavior", "global", "natural");

const rowGenerator: RowGenerator<string> = ({ ref, item }) => {
    return (
        <LocationView
            location={item}
            ref={ref as React.ForwardedRef<HTMLDivElement>}
        />
    );
};

/**
 *
 * @param options
 * @param options.name The name of the registered section
 * @param options.context Unused
 * @param options.startOpen Sections will start open instead of closed if true
 * @returns
 */
const SectionView = ({
    name,
    context,
    startOpen,
}: {
    name: string;
    context: unknown;
    startOpen?: boolean;
}) => {
    const isClosable = name !== "root";
    const [isOpen, setIsOpen] = useState(
        isClosable ? (startOpen ?? false) : true
    );
    const serviceContext = useContext(ServiceContext);
    const sectionManager = serviceContext.sectionManager;
    const locationManager = serviceContext.locationManager;
    const tagManager = serviceContext.tagManager;
    const optionManager = serviceContext.optionManager;
    if (!sectionManager) {
        throw new Error("No group context provided");
    }
    if (!optionManager) {
        throw new Error("No option manager provided");
    }

    const section = useSection(sectionManager, name);
    const style = {
        borderLeft: `2px dashed ${section?.theme.color ?? "Black"}`,
        paddingLeft: "0.5em",
        marginLeft: "0.5em",
        minWidth: "10em",
    };

    const clearedLocationCount =
        (section?.checkReport.checked.size ?? 0) +
        (section?.checkReport.ignored.size ?? 0);
    const totalLocationCount = section?.checkReport.existing.size ?? 0;
    const checkedLocationBehavior = useOption(
        optionManager,
        "checkedLocationBehavior",
        "global"
    ) as "nothing" | "separate" | "hide";

    const clearedSectionBehavior = useOption(
        optionManager,
        "clearedSectionBehavior",
        "global"
    ) as "nothing" | "separate" | "hide";

    const locationOrderBehavior = useOption(
        optionManager,
        "checkOrderBehavior",
        "global"
    ) as "lexical" | "natural" | "id";

    /**
     * Compares two locations to determine their relative order
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
     * @param a Location name a
     * @param b Location name b
     * @returns negative if a is before b, positive if a is after b, 0 if they are equivalent
     */
    const locationCompare = (a: string, b: string): number => {
        const statusA = locationManager.getLocationStatus(a);
        const statusB = locationManager.getLocationStatus(b);
        if (
            checkedLocationBehavior === "separate" &&
            statusA.checked !== statusB.checked
        ) {
            return statusA.checked ? 1 : -1;
        }

        if (locationOrderBehavior === "natural") {
            return naturalSort(a, b);
        } else if (locationOrderBehavior === "id") {
            return statusA.id - statusB.id;
        }
        return a < b ? -1 : 1;
    };

    /**
     * Filter that removes any locations that do not exist or are hidden by settings.
     * @param locationName
     * @returns
     */
    const locationFilter = (locationName: string): boolean => {
        const locationStatus = locationManager.getLocationStatus(locationName);
        return (
            locationStatus.exists &&
            (checkedLocationBehavior !== "hide" || !locationStatus.checked)
        );
    };

    const locations: string[] = useMemo(() => {
        const locationNames = [...(section?.checks.keys() ?? [])].filter(
            locationFilter
        );
        locationNames.sort(locationCompare);
        return locationNames;
    }, [locationOrderBehavior, section?.checks, locationManager]);

    /**
     * Compares two sections to determine their relative order
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
     * @param a section name a
     * @param b section name b
     * @returns negative if a is before b, positive if a is after b, 0 if they are equivalent
     */
    const sectionCompare = (a: string, b: string): number => {
        const sectionA = sectionManager.getSectionStatus(a);
        const sectionB = sectionManager.getSectionStatus(b);
        const indexA = section.children.indexOf(a);
        const indexB = section.children.indexOf(b);
        const sectionAClear =
            sectionA.checkReport.checked.size ===
            sectionA.checkReport.existing.size;
        const sectionBClear =
            sectionB.checkReport.checked.size ===
            sectionB.checkReport.existing.size;

        if (
            clearedSectionBehavior === "separate" &&
            sectionAClear !== sectionBClear
        ) {
            return sectionAClear ? 1 : -1;
        }
        // maintain original order;
        return indexA - indexB;
    };

    /**
     * Removes any section that should be hidden by settings such as empty and cleared sections
     * @param sectionName The name of the section being filtered
     * @returns
     */
    const sectionFilter = (sectionName: string) => {
        const sectionInQuestion = sectionManager.getSectionStatus(sectionName);
        return (
            sectionInQuestion?.checkReport.existing.size > 0 &&
            (clearedSectionBehavior !== "hide" ||
                sectionInQuestion.checkReport.checked.size <
                    sectionInQuestion.checkReport.existing.size)
        );
    };

    const childSections = section?.children.filter(sectionFilter) ?? [];
    childSections.sort(sectionCompare);

    return (
        <>
            {section?.checkReport.existing.size === 0 ? (
                <></> // Hide empty sections
            ) : (
                <div style={style}>
                    <h3
                        style={{ cursor: isClosable ? "pointer" : "default" }}
                        className={`section_title ${
                            section?.checkReport.checked.size ===
                            section?.checkReport.existing.size
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
                            {clearedLocationCount}
                            {"/"}
                            {totalLocationCount}
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
                                            `/${section?.checkReport.tagTotals.get(id)?.size ?? 0}`}{" "}
                                    </i>
                                );
                            }
                        )}
                        {isClosable ? (isOpen ? " ▲ " : " ▼ ") : ""}
                    </h3>
                    {isOpen && (
                        <>
                            {locations.length < 30 ? (
                                locations.map((location) => (
                                    <LocationView
                                        location={location}
                                        key={location}
                                    />
                                ))
                            ) : (
                                <LargeList<string>
                                    items={locations}
                                    defaultRowSize={22}
                                    rowGenerator={rowGenerator}
                                    style={{ width: "50vw", height: "50vh" }}
                                />
                            )}
                            {childSections.map((childName) => {
                                return (
                                    <SectionView
                                        name={childName}
                                        context={context}
                                        key={childName}
                                        startOpen={startOpen}
                                    />
                                );
                            })}
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default SectionView;
