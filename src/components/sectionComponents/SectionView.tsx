// @ts-check
import React, { useContext, useMemo, useState } from "react";
import LocationView from "./LocationView";
import ServiceContext from "../../contexts/serviceContext";
import Icon from "../icons/icons";
import useOption from "../../hooks/optionHook";
import { naturalSort } from "../../utility/comparisons";
import { useSection } from "../../hooks/sectionHooks";
import LargeList, { RowGenerator } from "../LayoutUtilities/LargeList";

const rowGenerator: RowGenerator<string> = ({ ref, item }) => {
    return (
        <LocationView
            location={item}
            ref={ref as React.ForwardedRef<HTMLDivElement>}
        />
    );
};

const virtualizationThreshold = 30;

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
    const locationTracker = serviceContext.locationTracker;
    const locationManager = serviceContext.locationManager;
    const tagManager = serviceContext.tagManager;
    const optionManager = serviceContext.optionManager;
    if (!optionManager) {
        throw new Error("No option manager provided");
    }
    const section = useSection(locationTracker, name);
    const style = {
        borderLeft: `2px dashed ${section?.theme.color ?? "Black"}`,
        paddingLeft: "0.5em",
        marginLeft: "0.5em",
        minWidth: "10em",
    };

    const clearedLocationCount =
        (section?.locationReport.checked.size ?? 0) +
        (section?.locationReport.ignored.size ?? 0);
    const totalLocationCount = section?.locationReport.existing.size ?? 0;
    const checkedLocationBehavior = useOption(
        optionManager,
        "LocationTracker:cleared_location_behavior",
        "global"
    ) as "nothing" | "separate" | "hide";

    const clearedSectionBehavior = useOption(
        optionManager,
        "LocationTracker:cleared_section_behavior",
        "global"
    ) as "nothing" | "separate" | "hide";

    const locationOrderBehavior = useOption(
        optionManager,
        "LocationTracker:location_order",
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
        const locationNames = [...(section?.locations ?? [])].filter(
            locationFilter
        );
        locationNames.sort(locationCompare);
        return locationNames;
    }, [
        locationOrderBehavior,
        checkedLocationBehavior,
        section?.locations,
        locationManager,
    ]);

    /**
     * Compares two sections to determine their relative order
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
     * @param a section name a
     * @param b section name b
     * @returns negative if a is before b, positive if a is after b, 0 if they are equivalent
     */
    const sectionCompare = (a: string, b: string): number => {
        const sectionA = locationTracker.getSection(a);
        const sectionB = locationTracker.getSection(b);
        const indexA = section.children.indexOf(a);
        const indexB = section.children.indexOf(b);
        const sectionAClear =
            sectionA.locationReport.checked.size ===
            sectionA.locationReport.existing.size;
        const sectionBClear =
            sectionB.locationReport.checked.size ===
            sectionB.locationReport.existing.size;

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
        const sectionInQuestion = locationTracker.getSection(sectionName);
        return (
            sectionInQuestion?.locationReport.existing.size > 0 &&
            (clearedSectionBehavior !== "hide" ||
                sectionInQuestion.locationReport.checked.size <
                    sectionInQuestion.locationReport.existing.size)
        );
    };

    const childSections = section?.children.filter(sectionFilter) ?? [];
    childSections.sort(sectionCompare);

    return (
        <>
            {section?.locationReport.existing.size === 0 &&
            section?.id !== "root" ? (
                <></> // Hide empty sections
            ) : (
                <div style={style}>
                    <h3
                        style={{ cursor: isClosable ? "pointer" : "default" }}
                        className={`section_title ${
                            section?.locationReport.checked.size ===
                            section?.locationReport.existing.size
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
                        {[...(section?.locationReport.tagCounts ?? [])].map(
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
                                            `/${section?.locationReport.tagTotals.get(id)?.size ?? 0}`}{" "}
                                    </i>
                                );
                            }
                        )}
                        {isClosable ? (isOpen ? " ▲ " : " ▼ ") : ""}
                    </h3>
                    {isOpen && (
                        <>
                            {locations.length < virtualizationThreshold ? (
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
                                    style={{
                                        width: "95%",
                                        overflow: "hidden",
                                        resize: "vertical",
                                        height: "25vh",
                                        boxShadow:
                                            "2px 3px 5px rgba(0, 0, 0, 0.5)",
                                    }}
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
