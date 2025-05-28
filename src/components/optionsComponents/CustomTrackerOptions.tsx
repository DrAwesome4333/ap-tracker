import React, { useMemo, useState } from "react";
import { useCustomTrackerDirectory } from "../../hooks/trackerHooks";
import { tertiary } from "../../constants/colors";
import { DangerButton, PrimaryButton } from "../buttons";
import Icon from "../icons/icons";
import CustomTrackerManager from "../../games/generic/categoryGenerators/customTrackerManager";
import TrackerManager from "../../games/TrackerManager";
import CreateCustomTrackerModal from "./CreateCustomTrackerModal";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import { exportJSONFile } from "../../utility/jsonExport";
import { naturalSort } from "../../utility/comparisons";

const CustomTrackerOptions = ({
    trackerManager,
}: {
    trackerManager: TrackerManager;
}) => {
    const customTrackersDirectory = useCustomTrackerDirectory();
    const trackersByGame = useMemo(() => {
        const trackerMap: Map<
            string,
            {
                id: string;
                game: string;
                name: string;
                enabled: boolean;
            }[]
        > = new Map();
        customTrackersDirectory.customLists.forEach((tracker) => {
            const gameList = trackerMap.get(tracker.game) ?? [];
            gameList.push(tracker);
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
                                        key={tracker.id}
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
                                                    await CustomTrackerManager.getCustomTracker(
                                                        tracker.id
                                                    );
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
                                                        `tracker-export-${trackerData.name}`,
                                                        trackerData
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
                                                    CustomTrackerManager.removeCustomTracker(
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
                trackerManager={trackerManager}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
};

export default CustomTrackerOptions;
