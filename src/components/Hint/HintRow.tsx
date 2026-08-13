import { API } from "archipelago.js";
import { Hint, hintToText } from "../../services/HintManager";
import React, { forwardRef, useCallback, useContext, useState } from "react";
import Spinner from "../icons/spinner";
import { RowComponentProps } from "react-window";
import ap_styles from "../sharedStyles/archipelago.module.css";
import Icon from "../icons/icons";
import { TextButton } from "../shared/buttons";
import SlotContext from "../../contexts/slotContext";
import {
    MultiWorldContextData,
    MultiWorldContextHelper,
    SlotRelevance,
} from "../../services/MultiInfo/MultiWorldContextData";
import MultiWorldContext from "../../contexts/multiWorldContext";
import ServiceContext from "../../contexts/serviceContext";
import { copyToClipboard } from "../../utility/clipboard";

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

const getPlayerClass = (
    player: number,
    multiWorldContext?: MultiWorldContextData
) => {
    const relevance = multiWorldContext
        ? MultiWorldContextHelper.getSlotRelevance(multiWorldContext, player)
        : SlotRelevance.other;
    switch (relevance) {
        case SlotRelevance.own:
            return ap_styles.player + " " + ap_styles.ap_text;
        case SlotRelevance.tracked:
            return ap_styles.player_alt + " " + ap_styles.ap_text;
        case SlotRelevance.own_group:
            return ap_styles.group + " " + ap_styles.ap_text;
        case SlotRelevance.tracked_group:
            return ap_styles.group_alt + " " + ap_styles.ap_text;
        case SlotRelevance.other_group:
            return ap_styles.group_other + " " + ap_styles.ap_text;
        case SlotRelevance.other: //fallthrough
        default:
            return ap_styles.player_other + " " + ap_styles.ap_text;
    }
};

const getItemClass = (itemFlags: number) => {
    const special =
        itemFlags & API.itemClassifications.progression
            ? itemFlags & API.itemClassifications.useful
                ? ap_styles.item_prog_useful
                : ap_styles.item_prog
            : itemFlags & API.itemClassifications.useful
              ? ap_styles.item_useful
              : itemFlags & API.itemClassifications.trap
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
        const serviceContext = useContext(ServiceContext);
        const slotContext = useContext(SlotContext);
        const multiWorldContext = useContext(MultiWorldContext);
        const canChangeStatus =
            multiWorldContext &&
            [SlotRelevance.own, SlotRelevance.own_group].includes(
                MultiWorldContextHelper.getSlotRelevance(
                    multiWorldContext,
                    hint.receivingPlayer
                )
            ) &&
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
                            onClick={() =>
                                copyToClipboard(
                                    hintToText(multiWorldContext, hint)
                                )
                            }
                        >
                            <Icon type={"content_copy"} />
                        </TextButton>
                    </div>
                    <div>
                        <span
                            className={getPlayerClass(
                                hint.receivingPlayer,
                                multiWorldContext
                            )}
                        >
                            {MultiWorldContextHelper.getSlotName(
                                multiWorldContext,
                                hint.receivingPlayer
                            )}
                        </span>
                        {"'s"}
                        <br />
                        <span className={getItemClass(hint.itemFlags)}>
                            {MultiWorldContextHelper.getItemName(
                                multiWorldContext,
                                hint.receivingPlayer,
                                hint.itemId
                            )}
                        </span>
                    </div>
                    <div>
                        <span
                            className={getPlayerClass(
                                hint.findingPlayer,
                                multiWorldContext
                            )}
                        >
                            {MultiWorldContextHelper.getSlotName(
                                multiWorldContext,
                                hint.findingPlayer
                            )}
                        </span>
                        <br />
                        <span
                            className={
                                ap_styles.location + " " + ap_styles.ap_text
                            }
                        >
                            {MultiWorldContextHelper.getLocationName(
                                multiWorldContext,
                                hint.findingPlayer,
                                hint.locationId
                            )}
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
                                    serviceContext.hintManager &&
                                    serviceContext.hintManager.canUpdate
                                ) {
                                    setUpdateInProgress(true);
                                    serviceContext.hintManager
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
