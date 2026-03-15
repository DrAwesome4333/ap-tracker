import React, { useContext } from "react";
import ServiceContext from "../../contexts/serviceContext";
import { useHints } from "../../hooks/hintHook";
import HintRow from "./HintRow";
import { naturalSort } from "../../utility/comparisons";
import { HintFilter } from "./HintOptionDef";

import { List, useDynamicRowHeight } from "react-window";
import useCurrentMultiworldSlot from "../../hooks/useCurrentMultiworldSlot";

const HintTable = ({
    filters,
    searchKey,
    searchFilterMode,
}: {
    filters: HintFilter;
    searchKey: string;
    searchFilterMode: string;
}) => {
    const services = useContext(ServiceContext);
    const hints = useHints(services.hintManager);
    const rowHeight = useDynamicRowHeight({ defaultRowHeight: 66 });
    const playerSlot = useCurrentMultiworldSlot();
    const lowerSearchKey = searchKey.toLowerCase().trim();

    const filteredHints = hints.filter((hint) => {
        let passesPlayerFilter = false;
        let passesStatusFilter = false;
        let passesSearchKeyFilter = false;
        if (
            filters.own.includes("items") &&
            hint.item.receiver.slot === playerSlot.slot_number
        ) {
            passesPlayerFilter = true;
        }

        if (
            filters.own.includes("locations") &&
            hint.item.sender.slot === playerSlot.slot_number
        ) {
            passesPlayerFilter = true;
        }

        if (filters.status.includes(hint.status.toString())) {
            passesStatusFilter = true;
        }

        if (
            !lowerSearchKey ||
            (searchFilterMode === "item" &&
                hint.item.name.toLowerCase().includes(lowerSearchKey)) ||
            (searchFilterMode === "location" &&
                hint.item.locationName.toLowerCase().includes(lowerSearchKey))
        ) {
            passesSearchKeyFilter = true;
        }

        return (
            passesPlayerFilter && passesStatusFilter && passesSearchKeyFilter
        );
    });

    filteredHints.sort((a, b) => {
        let sortValue = 0;
        switch (filters.sort) {
            case "sender":
                sortValue = b.item.sender.slot - a.item.sender.slot;
                break;
            case "receiver":
                sortValue = b.item.receiver.slot - a.item.receiver.slot;
                break;
            default:
            case "status":
                sortValue = b.status - a.status;
                break;
        }
        if (sortValue === 0) {
            sortValue = naturalSort(a.item.name, b.item.name);
        }
        return sortValue;
    });

    return (
        <List
            style={{
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
            }}
            rowComponent={HintRow}
            rowCount={filteredHints.length}
            rowHeight={rowHeight}
            rowProps={{ hints: filteredHints }}
        />
    );
};

export default HintTable;
