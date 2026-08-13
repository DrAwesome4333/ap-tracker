import { useContext } from "react";
import ServiceContext from "../../contexts/serviceContext";
import { useHints } from "../../hooks/hintHook";
import HintRow from "./HintRow";
import { naturalSort } from "../../utility/comparisons";
import { HintFilter } from "./HintOptionDef";
import {
    MultiWorldContextHelper,
    SlotRelevance,
} from "../../services/MultiInfo/MultiWorldContextData";
import MultiWorldContext from "../../contexts/multiWorldContext";

import { List, useDynamicRowHeight } from "react-window";

const HintTable = ({
    filters,
    searchKey,
    searchFilterMode,
}: {
    filters: HintFilter;
    searchKey: string;
    searchFilterMode: string;
}) => {
    const multiWorldContext = useContext(MultiWorldContext);
    const serviceContext = useContext(ServiceContext);
    const hints = useHints(serviceContext.hintManager);
    const rowHeight = useDynamicRowHeight({ defaultRowHeight: 66 });
    const lowerSearchKey = searchKey.toLowerCase().trim();
    const trackSingleSlot = multiWorldContext.trackedSlot !== undefined;
    const filteredHints =
        hints?.filter((hint) => {
            let passesPlayerFilter = false;
            let passesStatusFilter = false;
            let passesSearchKeyFilter = false;

            const adequateRelevance = trackSingleSlot
                ? [SlotRelevance.own, SlotRelevance.own_group]
                : [
                      SlotRelevance.own,
                      SlotRelevance.own_group,
                      SlotRelevance.tracked,
                      SlotRelevance.tracked_group,
                  ];
            const itemRelevance = MultiWorldContextHelper.getSlotRelevance(
                multiWorldContext,
                hint.receivingPlayer
            );
            const locationRelevance = MultiWorldContextHelper.getSlotRelevance(
                multiWorldContext,
                hint.findingPlayer
            );
            if (
                filters.own.includes("items") &&
                adequateRelevance.includes(itemRelevance)
            ) {
                passesPlayerFilter = true;
            }

            if (
                filters.own.includes("locations") &&
                adequateRelevance.includes(locationRelevance)
            ) {
                passesPlayerFilter = true;
            }

            if (filters.status.includes(hint.status.toString())) {
                passesStatusFilter = true;
            }

            if (
                !lowerSearchKey ||
                (searchFilterMode === "item" &&
                    MultiWorldContextHelper.getItemName(
                        multiWorldContext,
                        hint.receivingPlayer,
                        hint.itemId
                    )
                        .toLowerCase()
                        .includes(lowerSearchKey)) ||
                (searchFilterMode === "location" &&
                    MultiWorldContextHelper.getLocationName(
                        multiWorldContext,
                        hint.findingPlayer,
                        hint.locationId
                    )
                        .toLowerCase()
                        .includes(lowerSearchKey))
            ) {
                passesSearchKeyFilter = true;
            }

            return (
                passesPlayerFilter &&
                passesStatusFilter &&
                passesSearchKeyFilter
            );
        }) ?? [];
    filteredHints.sort((a, b) => {
        let sortValue = 0;
        switch (filters.sort) {
            case "sender":
                sortValue = b.findingPlayer - a.findingPlayer;
                break;
            case "receiver":
                sortValue = b.receivingPlayer - a.receivingPlayer;
                break;
            default:
            case "status":
                sortValue = b.status - a.status;
                break;
        }
        if (sortValue === 0) {
            sortValue = naturalSort(
                MultiWorldContextHelper.getItemName(
                    multiWorldContext,
                    a.receivingPlayer,
                    a.itemId
                ),
                MultiWorldContextHelper.getItemName(
                    multiWorldContext,
                    b.receivingPlayer,
                    b.itemId
                )
            );
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
