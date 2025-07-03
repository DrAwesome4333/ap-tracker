import React, { useMemo, useState } from "react";
import { useCustomTrackerDirectory } from "../../hooks/trackerHooks";
import { tertiary } from "../../constants/colors";
import { DangerButton, PrimaryButton } from "../buttons";
import Icon from "../icons/icons";
// import CustomTrackerManager from "../../services/tracker/customTrackerManager";
// import TrackerManager_Old from "../../services/tracker/TrackerManager";
import CreateCustomTrackerModal from "./CreateCustomTrackerModal";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import { exportJSONFile } from "../../utility/jsonExport";
import { naturalSort } from "../../utility/comparisons";
import { CustomTrackerRepository } from "../../services/tracker/customTrackerManager";
import { TrackerResourceId } from "../../services/tracker/TrackerManager";
const CustomTrackerOptions = ({
    customTrackerRepository,
}: {
    customTrackerRepository: CustomTrackerRepository;
}) => {
    const customTrackersDirectory = useCustomTrackerDirectory(
        customTrackerRepository
    );
    const trackersByGame = useMemo(() => {
        const trackerMap: Map<
            string,
            {
                id: TrackerResourceId;
                game: string;
                name: string;
                enabled: boolean;
            }[]
        > = new Map();
        customTrackersDirectory.forEach((tracker) => {
            const gameList = trackerMap.get(tracker.game) ?? [];
            gameList.push({
                id: { ...tracker },
                game: tracker.game,
                name: tracker.name,
                enabled: true,
            });
            trackerMap.set(tracker.game, gameList);
        });
        const games = [...trackerMap.keys()];
        games.forEach((game) => {
            const list = trackerMap.get(game);
            list.sort((a, b) => naturalSort(a.name, b.name));
            trackerMap.set(game, list);
        });
        return trackerMap;
    }, [customTrackersDirectory]);

    const sortedGames = useMemo(() => {
        const games = [...trackersByGame.keys()];
        games.sort(naturalSort);
        return games;
    }, [trackersByGame]);

    const [modalOpen, setModalOpen] = useState(false);
    return (
        <div>
            <div>
                <p>Manage custom trackers here</p>
                {sortedGames.length > 0 ? (
                    sortedGames.map((game) => (
                        <div
                            key={game}
                            style={{
                                marginBottom: "2em",
                            }}
                        >
                            <h4>{game}</h4>
                            <div
                                style={{
                                    marginLeft: "1em",
                                }}
                            >
                                {trackersByGame.get(game).map((tracker) => (
                                    <div
                                        key={
                                            tracker.id.uuid +
                                            tracker.id.version +
                                            tracker.id.type
                                        }
                                        style={{
                                            marginBottom: "0.25em",
                                        }}
                                    >
                                        {tracker.name}
                                        {!tracker.enabled && "(Disabled)"}{" "}
                                        <PrimaryButton
                                            $tiny
                                            onClick={async () => {
                                                const trackerData =
                                                    (await customTrackerRepository.loadResource(
                                                        tracker.id.uuid,
                                                        tracker.id.version,
                                                        tracker.id.type
                                                    )) as DropdownLocationTracker;
                                                if (!tracker) {
                                                    NotificationManager.createStatus(
                                                        {
                                                            message:
                                                                "Failed to load tracker",
                                                            type: MessageType.error,
                                                            progress: 1,
                                                            duration: 5,
                                                        }
                                                    );
                                                } else {
                                                    exportJSONFile(
                                                        `tracker-export-${trackerData.manifest.name}`,
                                                        trackerData.exportDropdowns()
                                                    );
                                                }
                                            }}
                                        >
                                            <Icon
                                                fontSize="14px"
                                                type="download"
                                            />
                                        </PrimaryButton>
                                        <DangerButton
                                            $tiny
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        `Are you sure you want to delete ${tracker.name}?`
                                                    )
                                                ) {
                                                    customTrackerRepository.removeTracker(
                                                        tracker.id
                                                    );
                                                }
                                            }}
                                        >
                                            <Icon
                                                fontSize={"14px"}
                                                type="delete"
                                            />
                                        </DangerButton>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <i style={{ color: tertiary }}>
                        No custom trackers, try adding one below
                    </i>
                )}
            </div>
            <PrimaryButton
                $tiny
                onClick={() => {
                    setModalOpen(true);
                }}
            >
                <Icon type="add" />
            </PrimaryButton>
            <CreateCustomTrackerModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                }}
            />
        </div>
    );
};

export default CustomTrackerOptions;
