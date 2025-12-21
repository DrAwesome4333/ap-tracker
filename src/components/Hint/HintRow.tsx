import { API, Hint, Item } from "archipelago.js";
import React, { forwardRef, useCallback, useContext, useState } from "react";
import ServiceContext from "../../contexts/serviceContext";
import Spinner from "../icons/spinner";
import { RowComponentProps } from "react-window";
import ap_styles from "../sharedStyles/archipelago.module.css";
import MultiWorldContext from "../../services/MultiInfo/MultiWorldContext";

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

const getPlayerClass = (player: number) => {
    if (player === MultiWorldContext.loadedSlot.slot_number)
        return ap_styles.player + " " + ap_styles.ap_text;

    if (
        MultiWorldContext.loadedMultiWorld.slots.find(
            (s) => s.slot_number === player
        )
    )
        return ap_styles.player_alt + " " + ap_styles.ap_text;
    return ap_styles.player_other + " " + ap_styles.ap_text;
};

const getItemClass = (item: Item) => {
    const special = item.progression
        ? ap_styles.item_prog
        : item.useful
          ? ap_styles.item_useful
          : item.trap
            ? ap_styles.item_trap
            : ap_styles.item_normal;
    return special + " " + ap_styles.ap_text;
};

const HintRow = forwardRef(
    (
        { hints, index, style }: RowComponentProps<{ hints: Hint[] }>,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const hint = hints[index];
        const odd = index % 2 === 1;
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
            <div
                ref={ref}
                style={{
                    ...style,
                    display: "flex",
                    width: "100%",
                    boxSizing: "border-box",
                    gap: "0.25em",
                    padding: "0.5em",
                    background: odd ? "rgba(128, 128, 128, 0.12)" : "",
                }}
            >
                <div>
                    <span className={getPlayerClass(hint.item.receiver.slot)}>
                        {hint.item.receiver.alias}
                    </span>
                    {"'s"}{" "}
                    <span className={getItemClass(hint.item)}>
                        {hint.item.name}
                    </span>{" "}
                    is at{" "}
                    <span
                        className={ap_styles.location + " " + ap_styles.ap_text}
                    >
                        {hint.item.locationName}
                    </span>{" "}
                    (
                    <span
                        className={ap_styles.entrance + " " + ap_styles.ap_text}
                    >
                        {hint.entrance}
                    </span>
                    ) in{" "}
                    <span className={getPlayerClass(hint.item.sender.slot)}>
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
