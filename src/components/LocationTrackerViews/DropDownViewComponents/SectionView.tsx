import React, { useContext, useMemo, useState } from "react";
import LocationView from "./LocationView";
import ServiceContext from "../../../contexts/serviceContext";
import Icon from "../../icons/icons";
import useOption from "../../../hooks/optionHook";
import { naturalSort } from "../../../utility/comparisons";
import { useSection } from "../../../hooks/sectionHooks";
import { TextButton } from "../../buttons";
import { LocationTrackerType } from "../../../services/tracker/resourceEnums";
import { TagEntityType } from "../../../services/tags/tagManager";
import { useTagCounters } from "../../../hooks/tagHook";
import { List, useDynamicRowHeight } from "react-window";

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
    startOpen,
    selectedLocation,
    onLocationSelect,
}: {
    name: string;
    startOpen?: boolean;
    selectedLocation?: string;
    onLocationSelect?: (locationName: string) => void;
}) => {
    const rowHeight = useDynamicRowHeight({ defaultRowHeight: 22 });
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
    const style: React.CSSProperties = {
        borderLeft: `0.125em solid ${section?.theme.color ?? "Black"}`,
        borderRadius: "0.25em",
        paddingLeft: "0.5em",
        marginLeft: "0.5em",
        marginTop: "0.5em",
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
    ) as "lexical" | "natural" | "id" | "listed";

    const trackerOptionOverrides = useOption(
        optionManager,
        "LocationTracker:allow_tracker_option_overrides",
        "global"
    ) as boolean;

    const trackerDefinedOrder =
        locationTracker?.optionOverrides?.locationOrder ??
        locationOrderBehavior;

    const locationOrder = trackerOptionOverrides
        ? trackerDefinedOrder
        : locationOrderBehavior;

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

        if (locationOrder === "natural") {
            return naturalSort(a, b);
        } else if (locationOrder === "id") {
            return statusA.id - statusB.id;
        } else if (locationOrder === "lexical") {
            return a < b ? -1 : 1;
        }
        // leave ordering as listed
        return -1;
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
        locationOrder,
        checkedLocationBehavior,
        section?.locations,
        locationManager,
        section?.locationReport,
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

    const locationNames = section?.locationReport
        ? [...section.locationReport.existing.values()]
        : [];
    const locationStatuses = locationNames.map((locationName) =>
        locationManager.getLocationStatus(locationName)
    );

    const locationIds = locationStatuses.map((status) => status.id ?? 0);
    const locationCounterStatuses = locationStatuses.map((status) => ({
        checked: status.checked,
        ignored: status.ignored,
        exists: status.exists,
    }));

    const tagCounts = useTagCounters(
        tagManager,
        TagEntityType.location,
        locationIds,
        locationCounterStatuses
    );

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
                    <TextButton
                        onClick={() => {
                            if (isClosable) {
                                setIsOpen(!isOpen);
                            }
                        }}
                    >
                        <h3
                            style={{
                                cursor: isClosable ? "pointer" : "default",
                                marginTop: "0.25em",
                                marginBottom: "0.25em",
                            }}
                            className={`section_title ${
                                section?.locationReport.checked.size ===
                                section?.locationReport.existing.size
                                    ? "checked"
                                    : ""
                            }`}
                        >
                            {locationTracker?.manifest.locationTrackerType ===
                            LocationTrackerType.dropdown
                                ? (section?.title ?? "Loading...")
                                : `Unsupported tracker type ${locationTracker?.manifest.locationTrackerType}`}{" "}
                            <i>
                                {clearedLocationCount}
                                {"/"}
                                {totalLocationCount}
                            </i>{" "}
                            {tagCounts.map((counter) => {
                                return (
                                    <i
                                        key={counter.counter_id}
                                        style={{ color: counter.color }}
                                        title={counter.display_name}
                                    >
                                        <Icon
                                            fontSize="14px"
                                            type={counter.icon_id}
                                            iconParams={counter.icon_spec}
                                        />
                                        {counter.count}
                                        {counter.total !== null &&
                                            `/${counter.total}`}{" "}
                                    </i>
                                );
                            })}
                            {isClosable ? (
                                <Icon
                                    iconParams={{
                                        fill: 0,
                                        opticalSize: 24,
                                        weight: 700,
                                        grade: 200,
                                    }}
                                    type="arrow_drop_down"
                                    fontSize="24px"
                                    style={{
                                        transform: isOpen
                                            ? "rotate(0deg)"
                                            : "rotate(-90deg)",
                                        transition: "all 0.25s",
                                        userSelect: "none",
                                    }}
                                />
                            ) : (
                                ""
                            )}
                        </h3>
                    </TextButton>
                    {isOpen && (
                        <>
                            {locations.length > 0 && (
                                <List
                                    style={{
                                        width: "95%",
                                        margin: "1em",
                                        boxShadow:
                                            "2px 3px 5px rgba(0, 0, 0, 0.5)",
                                        maxHeight: "75vh",
                                    }}
                                    rowComponent={LocationView}
                                    rowHeight={rowHeight}
                                    rowProps={{
                                        locations,
                                        onLocationSelect,
                                        selectedLocation,
                                    }}
                                    rowCount={locations.length}
                                />
                            )}

                            {childSections.map((childName) => {
                                return (
                                    <SectionView
                                        name={childName}
                                        key={childName}
                                        startOpen={startOpen}
                                        onLocationSelect={onLocationSelect}
                                        selectedLocation={selectedLocation}
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
