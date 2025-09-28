import React, { useContext } from "react";
import ServiceContext from "../../../contexts/serviceContext";
import { useTag } from "../../../hooks/tagHook";
import { textPrimary } from "../../../constants/colors";
import Icon from "../../icons/icons";
import { LocationStatus } from "../../../services/locations/locationManager";

const LocationTagView = ({
    tagId,
    locationStatus,
}: {
    tagId: string;
    locationStatus: LocationStatus;
}) => {
    const services = useContext(ServiceContext);
    const tagManager = services.tagManager;
    const tag = useTag(tagManager, tagId);
    const tagType = tagManager.getTagType(tag.type_id, {
        checked: locationStatus.checked,
        ignored: locationStatus.ignored,
    });

    return (
        <div
            style={{
                marginLeft: "1rem",
                color: tagType.text_color ?? textPrimary,
                textDecoration: "none",
                // display: "inline-block",
            }}
        >
            <Icon
                fontSize="14px"
                type={tagType.icon_id}
                style={{
                    color: tagType.icon_color ?? textPrimary,
                }}
            />{" "}
            {tag.data ?? tagType.display_name}
        </div>
    );
};

export default LocationTagView;
