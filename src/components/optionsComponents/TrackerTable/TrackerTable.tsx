import React, { useSyncExternalStore } from "react";
import { primary, secondary } from "../../../constants/colors";
import styled from "styled-components";
import { naturalSort } from "../../../utility/comparisons";
import TrackerTableRow from "./TrackerTableRow";
import { CustomTrackerRepository } from "../../../services/tracker/customTrackerRepository";
import { ResourceManifest } from "../../../services/tracker/resource";
import { ResourceType } from "../../../services/tracker/resourceEnums";

const trackerTypeToString = {
    [ResourceType.locationTracker]: "Location",
    [ResourceType.itemTracker]: "Item",
};

const Table = styled.table`
    border: 2px solid ${primary};
    border-spacing: 0;
    th {
        font-weight: bold;
        border: 1px solid ${secondary};
        text-align: center;
        padding: 0.25em 1em;
    }
    td {
        border: 1px dotted ${secondary};
        text-align: center;
        padding: 0.25em 1em;
    }
`;

const TrackerTable = ({
    customTrackerRepository,
}: {
    customTrackerRepository: CustomTrackerRepository;
}) => {
    const trackers = useSyncExternalStore(
        customTrackerRepository.getUpdateSubscriber(),
        () => customTrackerRepository.resources,
        () => customTrackerRepository.resources
    );

    trackers.sort((a, b) => {
        let sortValue = naturalSort(a.game, b.game);
        if (sortValue === 0) {
            sortValue = naturalSort(a.type, b.type);
        }
        if (sortValue === 0) {
            if (a.uuid === b.uuid) {
                sortValue = naturalSort(a.version, b.version);
            } else {
                sortValue = naturalSort(a.name, b.name);
            }
        }
        return sortValue;
    });

    const trackersByGameAndType: [string, ResourceManifest[]][] = [];
    trackers.forEach((manifest) => {
        const titleKey = `${trackerTypeToString[manifest.type] ?? "???"} trackers for ${manifest.game}`;
        const lastIndex = trackersByGameAndType.length - 1;
        if (
            trackersByGameAndType.length === 0 ||
            trackersByGameAndType[lastIndex][0] !== titleKey
        ) {
            trackersByGameAndType.push([titleKey, [manifest]]);
        } else {
            trackersByGameAndType[lastIndex][1].push(manifest);
        }
    });
    return (
        <Table>
            <thead>
                <tr>
                    <th> Name </th>
                    <th> Version </th>
                    <th> Actions</th>
                </tr>
            </thead>
            <tbody>
                {trackers.length > 0 ? (
                    trackersByGameAndType.map(([title, trackerManifests]) => (
                        <React.Fragment key={title}>
                            <tr>
                                <td
                                    colSpan={3}
                                    style={{
                                        borderTopStyle: "solid",
                                        borderTopWidth: "0.25em",
                                        borderBottom: "none",
                                        padding: "1em",
                                    }}
                                >
                                    {title}
                                </td>
                            </tr>
                            {trackerManifests.map((tracker) => (
                                <TrackerTableRow
                                    key={
                                        tracker.uuid +
                                        tracker.version +
                                        tracker.type
                                    }
                                    customTrackerRepository={
                                        customTrackerRepository
                                    }
                                    tracker={tracker}
                                />
                            ))}
                        </React.Fragment>
                    ))
                ) : (
                    <tr>
                        <td colSpan={3}>No Trackers available</td>
                    </tr>
                )}
            </tbody>
        </Table>
    );
};

export default TrackerTable;
