import React, { useContext } from "react";
import { Resource, ResourceManifest } from "../../../services/tracker/resource";
import {
    ItemTrackerType,
    LocationTrackerType,
    ResourceType,
} from "../../../services/tracker/resourceEnums";
import ServiceContext from "../../../contexts/serviceContext";
import { useCurrentGameTracker } from "../../../hooks/trackerHooks";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../buttons";
import Icon from "../../icons/icons";
import { CustomTrackerRepository } from "../../../services/tracker/customTrackerRepository";
import NotificationManager, {
    MessageType,
} from "../../../services/notifications/notifications";
import { exportJSONFile } from "../../../utility/jsonExport";
import { DropdownLocationTracker } from "../../../services/tracker/locationTrackers/locationTrackers";
import { GroupItemTracker } from "../../../services/tracker/itemTrackers/itemTrackers";

const TrackerTableRow = ({
    tracker,
    customTrackerRepository,
}: {
    tracker: ResourceManifest;
    customTrackerRepository: CustomTrackerRepository;
}) => {
    const services = useContext(ServiceContext);
    const trackerManager = services.trackerManager;
    const currentTracker = useCurrentGameTracker(
        tracker.game,
        trackerManager,
        tracker.type
    );
    const inUse =
        currentTracker.uuid === tracker.uuid &&
        currentTracker.type === tracker.type &&
        currentTracker.version === tracker.version;
    return (
        <tr
            style={{
                backgroundColor: inUse ? "rgba(0, 128, 0, 0.5)" : "",
            }}
        >
            <td>{tracker.name}</td>
            <td>{tracker.version}</td>
            <td>
                <PrimaryButton
                    $tiny
                    onClick={async () => {
                        const trackerData = (await customTrackerRepository
                            .loadResource(
                                tracker.uuid,
                                tracker.version,
                                tracker.type
                            )
                            .catch((e) => {
                                NotificationManager.createToast({
                                    message: "Failed to load tracker",
                                    type: MessageType.error,
                                    details: e.toString(),
                                    duration: 5,
                                });
                            })) as Resource;
                        if (!trackerData) {
                            NotificationManager.createStatus({
                                message: "Failed to load tracker",
                                type: MessageType.error,
                                progress: 1,
                                duration: 5,
                            });
                        } else {
                            let data = null;
                            if (
                                trackerData.manifest.type ===
                                    ResourceType.locationTracker &&
                                trackerData.manifest.locationTrackerType ===
                                    LocationTrackerType.dropdown
                            ) {
                                data = (
                                    trackerData as DropdownLocationTracker
                                ).exportDropdowns();
                            }

                            if (
                                trackerData.manifest.type ===
                                    ResourceType.itemTracker &&
                                trackerData.manifest.itemTrackerType ===
                                    ItemTrackerType.group
                            ) {
                                data = (
                                    trackerData as GroupItemTracker
                                ).exportGroups();
                            }
                            if (data) {
                                exportJSONFile(
                                    `tracker-export-${trackerData.manifest.name.replace(/\s/g, "")}`,
                                    data
                                );
                            } else {
                                NotificationManager.createStatus({
                                    message: "Cannot export tracker",
                                    type: MessageType.error,
                                    progress: 1,
                                    duration: 5,
                                });
                            }
                        }
                    }}
                >
                    <Icon fontSize="14px" type="download" />
                </PrimaryButton>
                <DangerButton
                    $tiny
                    onClick={() => {
                        if (
                            window.confirm(
                                `Are you sure you want to delete ${tracker.name}?`
                            )
                        ) {
                            customTrackerRepository.removeTracker(tracker);
                        }
                    }}
                >
                    <Icon fontSize="14px" type="delete" />
                </DangerButton>
                {!inUse && (
                    <SecondaryButton
                        $tiny
                        onClick={() => {
                            trackerManager.setGameTracker(
                                tracker.game,
                                tracker
                            );
                        }}
                    >
                        {" "}
                        <Icon fontSize="14px" type="check_small" />{" "}
                    </SecondaryButton>
                )}
                {inUse && (
                    <SecondaryButton
                        $tiny
                        onClick={() => {
                            trackerManager.setGameTracker(tracker.game, {
                                type: tracker.type,
                            });
                        }}
                    >
                        {" "}
                        <Icon fontSize="14px" type="eject" />{" "}
                    </SecondaryButton>
                )}
            </td>
        </tr>
    );
};

export default TrackerTableRow;
