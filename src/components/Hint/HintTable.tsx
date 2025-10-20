import { Hint } from "archipelago.js";
import React, { useContext } from "react";
import ServiceContext from "../../contexts/serviceContext";
import { useHints } from "../../hooks/hintHook";
import HintRow from "./HintRow";
import LargeList, { RowGenerator } from "../LayoutUtilities/LargeList";
import { naturalSort } from "../../utility/comparisons";
import { HintFilter } from "./HintOptionDef";

const rowGenerator: RowGenerator<Hint> = ({ ref, item }) => {
    return (
        <HintRow
            key={item.uniqueKey}
            hint={item}
            ref={ref as React.ForwardedRef<HTMLDivElement>}
        />
    );
};

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
    const playerSlot =
        services.connector?.connection.client.players.self.slot ?? -1;
    const lowerSearchKey = searchKey.toLowerCase().trim();

    const filteredHints = hints.filter((hint) => {
        let passesPlayerFilter = false;
        let passesStatusFilter = false;
        let passesSearchKeyFilter = false;
        if (filters.ownItems && hint.item.receiver.slot === playerSlot) {
            passesPlayerFilter = true;
        }

        if (filters.ownLocations && hint.item.sender.slot === playerSlot) {
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
        <LargeList<Hint>
            items={filteredHints}
            defaultRowSize={19}
            rowGenerator={rowGenerator}
            style={{
                boxSizing: "border-box",
                overflow: "hidden",
                width: "100%",
                height: "100%",
            }}
        />
    );
};

export default HintTable;
