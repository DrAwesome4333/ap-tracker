import React from "react";
import styled from "styled-components";
type IconParams = {
    /** 0 for no fill, 1 for fill */
    fill?: number;
    /** Line weight */
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
    /** Emphasis */
    grade?: -25 | 0 | 200;
    /** Optical Size, px */
    opticalSize?: 20 | 24 | 40 | 48;
};
const IconContainer = styled.span.attrs({
    className: "material-symbols-rounded",
})<{ $: IconParams }>`
    font-variation-settings:
        "FILL" ${(props) => props.$.fill ?? 1},
        "wght" ${(props) => props.$.weight ?? 400},
        "GRAD" ${(props) => props.$.grade ?? 0},
        "opsz" ${(props) => props.$.opticalSize ?? 24};
`;
const supportedIcons = [
    "add",
    "add_circle",
    "add_location_alt",
    "attach_money",
    "arrow_drop_down",
    "arrow_drop_down_circle",
    "beenhere",
    "block",
    "bolt",
    "bookmark",
    "check_circle",
    "check_indeterminate_small",
    "check_small",
    "checklist",
    "counter_1",
    "counter_2",
    "counter_3",
    "counter_4",
    "counter_5",
    "counter_6",
    "counter_7",
    "counter_8",
    "counter_9",
    "delete",
    "delete_forever",
    "download",
    "eject",
    "expand_circle_down",
    "filter_alt",
    "flag",
    "flag_check",
    "fmd_bad",
    "home",
    "info",
    "label",
    "location_off",
    "location_on",
    "mystery",
    "new_label",
    "not_listed_location",
    "palette",
    "pentagon",
    "price_change",
    "price_check",
    "radio_button_checked",
    "radio_button_unchecked",
    "search_check",
    "settings",
    "star",
    "sticky_note",
    "sync",
    "sync_arrow_down",
    "sync_arrow_up",
    "upload_file",
    "wrong_location",
];

const link = document.createElement("link");
link.rel = "stylesheet";
link.href = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${supportedIcons
    .sort()
    .join(",")}&display=block`;
document.head.appendChild(link);

/** Creates an icon of the specified type */
const Icon = ({
    type,
    fontSize,
    iconParams,
    style,
}: {
    type: string;
    fontSize?: string;
    style?: React.CSSProperties;
    iconParams?: IconParams;
}) => {
    return (
        <IconContainer
            style={{
                ...style,
                fontSize: fontSize ?? "24px",
                verticalAlign: "middle",
            }}
            $={iconParams ?? {}}
        >
            {type}
        </IconContainer>
    );
};

export default Icon;
