import { API, Hint, Item } from "archipelago.js";
import React, { forwardRef, useCallback, useContext, useState } from "react";
import Spinner from "../icons/spinner";
import { RowComponentProps } from "react-window";
import ap_styles from "../sharedStyles/archipelago.module.css";
import MultiWorldContext from "../../services/MultiInfo/MultiWorldContext";
import Icon from "../icons/icons";
import { TextButton } from "../shared/buttons";
import useCurrentMultiworldSlot from "../../hooks/useCurrentMultiworldSlot";
import SlotContext from "../../contexts/slotContext";

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
const hintStatusToClassMap: { [status: number]: string } = {
    [API.HintStatus.no_priority]: ap_styles.hint_no_priority,
    [API.HintStatus.unspecified]: ap_styles.hint_unspecified,
    [API.HintStatus.avoid]: ap_styles.hint_avoid,
    [API.HintStatus.priority]: ap_styles.hint_priority,
    [API.HintStatus.found]: ap_styles.hint_found,
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
        ? item.useful
            ? ap_styles.item_prog_useful
            : ap_styles.item_prog
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
        const slotContext = useContext(SlotContext);
        const canChangeStatus =
            hint.item.receiver.slot === slotContext.slotNumber &&
            hint.status !== API.HintStatus.found &&
            slotContext.liveSlot;
        const [updateInProgress, setUpdateInProgress] = useState(false);
        const finishUpdate = useCallback(() => {
            setUpdateInProgress(false);
        }, [setUpdateInProgress]);
        return (
            <div
                ref={ref}
                style={{
                    ...style,
                    display: "grid",
                    width: "100%",
                    boxSizing: "border-box",
                    gap: "0.25em",
                    padding: "0.5em",
                    background: odd ? "rgba(128, 128, 128, 0.12)" : "",
                    gridTemplateColumns: "5fr 1fr",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "auto repeat(2, 1fr)",
                        alignItems: "center",
                        columnGap: "0.5em",
                    }}
                >
                    <div>
                        <TextButton
                            onClick={() => {
                                if (window.navigator.clipboard) {
                                    try {
                                        window.navigator.clipboard.writeText(
                                            `${hint.item.receiver.alias}'s ${hint.item.name} is at ${hint.item.locationName} ${hint.entrance === "Vanilla" ? "" : `(${hint.entrance}) `}in ${hint.item.sender}'s world. (${statusToText[hint.status]})`
                                        );
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                            }}
                        >
                            <Icon type={"content_copy"} />
                        </TextButton>
                    </div>
                    <div>
                        <span
                            className={getPlayerClass(hint.item.receiver.slot)}
                        >
                            {hint.item.receiver.alias}
                        </span>
                        {"'s"}
                        <br />
                        <span className={getItemClass(hint.item)}>
                            {hint.item.name}
                        </span>
                    </div>
                    <div>
                        <span className={getPlayerClass(hint.item.sender.slot)}>
                            {hint.item.sender.alias}
                        </span>
                        <br />
                        <span
                            className={
                                ap_styles.location + " " + ap_styles.ap_text
                            }
                        >
                            {hint.item.locationName}
                        </span>
                        {hint.entrance !== "Vanilla" && (
                            <>
                                <br />
                                <span
                                    className={
                                        ap_styles.entrance +
                                        " " +
                                        ap_styles.ap_text
                                    }
                                >
                                    {hint.entrance}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div
                    className={[
                        ap_styles.ap_text,
                        hintStatusToClassMap[hint.status],
                    ].join(" ")}
                >
                    {canChangeStatus ? (
                        <select
                            value={hint.status}
                            disabled={updateInProgress}
                            onChange={(e) => {
                                if (
                                    slotContext.hintManager &&
                                    slotContext.hintManager.canUpdate
                                ) {
                                    setUpdateInProgress(true);
                                    slotContext.hintManager
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
