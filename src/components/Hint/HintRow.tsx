import { API, Hint, Item } from "archipelago.js";
import React, { forwardRef, useCallback, useContext, useState } from "react";
import ServiceContext from "../../contexts/serviceContext";
import {
    normalItem,
    progressionItem,
    textClient,
    trapItem,
    usefulItem,
} from "../../constants/colors";
import Spinner from "../icons/spinner";
const statusSelections = [
    API.HintStatus.priority,
    API.HintStatus.avoid,
    API.HintStatus.no_priority,
    API.HintStatus.unspecified,
];
const statusToText = {
    [API.HintStatus.unspecified]: "Unspecified",
    [API.HintStatus.no_priority]: "No Priority",
    [API.HintStatus.avoid]: "Avoid",
    [API.HintStatus.priority]: "Priority",
    [API.HintStatus.found]: "Found",
};

const getPlayerColor = (ownSlot: number, player: number) => {
    return ownSlot === player ? textClient.magenta : textClient.yellow;
};

const getItemColor = (item: Item) => {
    return item.progression
        ? progressionItem
        : item.useful
          ? usefulItem
          : item.trap
            ? trapItem
            : normalItem;
};

const HintRow = forwardRef(
    ({ hint, odd }: { hint: Hint, odd: boolean }, ref: React.ForwardedRef<HTMLDivElement>) => {
        const services = useContext(ServiceContext);
        const playerSlot =
            services.connector?.connection.client.players.self.slot;
        const canChangeStatus =
            hint.item.receiver.slot === playerSlot &&
            hint.status !== API.HintStatus.found;
        const [updateInProgress, setUpdateInProgress] = useState(false);
        const finishUpdate = useCallback(() => {
            setUpdateInProgress(false);
        }, [setUpdateInProgress]);
        return (
            <div ref={ref} style={{
                        display: "flex",
                        width: "100%",
                        gap: "0.25em",
                        padding: "0.12em",
                        background: odd ? "rgba(128, 128, 128, 0.12)" : "",
                    }}>
                    <div>
                        <span
                            style={{
                                color: getPlayerColor(
                                    playerSlot,
                                    hint.item.receiver.slot
                                ),
                            }}
                        >
                            {hint.item.receiver.alias}
                        </span>
                        {"'s"}{" "}
                        <span
                            style={{
                                color: getItemColor(hint.item),
                            }}
                        >
                            {hint.item.name}
                        </span>{" "}
                        is at{" "}
                        <span style={{ color: textClient.green }}>
                            {hint.item.locationName}
                        </span>{" "}
                        (
                        <span style={{ color: textClient.blue }}>
                            {hint.entrance}
                        </span>
                        ) in{" "}
                        <span
                            style={{
                                color: getPlayerColor(
                                    playerSlot,
                                    hint.item.sender.slot
                                ),
                            }}
                        >
                            {hint.item.sender.alias}
                        </span>
                        {"'s"} world.
                    </div>
                    <div>
                        {canChangeStatus ? (
                            <select
                                value={hint.status}
                                disabled={updateInProgress}
                                onChange={(e) => {
                                    if (services.hintManager) {
                                        setUpdateInProgress(true);
                                        services.hintManager
                                            .updateHintStatus(
                                                hint,
                                                parseInt(e.target.value)
                                            )
                                            .then(finishUpdate);
                                    }
                                }}
                            >
                                {statusSelections.map((status) => (
                                    <option value={status} key={status}>
                                        {statusToText[status]}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            statusToText[hint.status]
                        )}
                        {updateInProgress ? (
                            <Spinner style={{ height: "14px" }} />
                        ) : (
                            <></>
                        )}
                    </div>

            </div>
        );
    }
);

HintRow.displayName = "HintRow";

export default HintRow;
