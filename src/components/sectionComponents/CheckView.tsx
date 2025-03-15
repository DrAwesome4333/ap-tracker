import React, {
    Fragment,
    useContext,
    useState,
    useSyncExternalStore,
} from "react";
import ServiceContext from "../../contexts/serviceContext";
import Icon from "../icons/icons";
import { textPrimary } from "../../constants/colors";
import { GhostButton } from "../buttons";
const CheckView = ({ check } : {
    check: string
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const serviceContext = useContext(ServiceContext);
    const checkManager = serviceContext.checkManager;
    if (!checkManager) {
        throw new Error("No check manager provided");
    }
    const tagManager = serviceContext.tagManager;
    const status = useSyncExternalStore(
        checkManager.getSubscriberCallback(check),
        () => checkManager.getCheckStatus(check),
        () => checkManager.getCheckStatus(check)
    );
    const connection = serviceContext.connector;

    const classes = new Set(["section_check"]);
    if (status.checked || status.ignored) {
        classes.add("checked");
        if (status.ignored) {
            classes.add("ignored");
        }
    }

    let iconType = status.checked ? "check_small" : "check_indeterminate_small";
    let iconColor = textPrimary;
    if (status.tags.length > 0 && serviceContext.tagManager) {
        let selectedTag = status.tags[0];
        let selectedTagType = selectedTag.type;
        for (let i = 1; i < status.tags.length; i++) {
            const tag = status.tags[i];
            const tagType = tag.type;
            // TODO add checks for if the tag is still active or not
            if (tagType.priority > selectedTagType.priority) {
                selectedTag = tag;
                selectedTagType = tagType;
            }
        }
        iconType = selectedTagType.icon;
        iconColor = selectedTagType.iconColor ?? iconColor;
    }
    return (
        <>
            {status.exists && (
                <div>
                    <span
                        className={[...classes].join(" ")}
                        onClick={() => {
                            setShowDetails(!showDetails);
                        }}
                    >
                        <Icon
                            fontSize="14px"
                            type={iconType}
                            style={{ color: iconColor }}
                        />{" "}
                        {check}
                        {connection && tagManager && (
                            <>
                                {!status.checked && (
                                    <GhostButton
                                        $tiny
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            if (
                                                !(
                                                    status.ignored ||
                                                    status.checked
                                                ) &&
                                                tagManager
                                            ) {
                                                const ignoreTag =
                                                    tagManager.createTagData();
                                                ignoreTag.typeId = "ignore";
                                                ignoreTag.checkName = check;
                                                ignoreTag.tagId = `${check}-ignore`;
                                                tagManager.addTag(
                                                    ignoreTag,
                                                    connection.connection
                                                        .slotInfo.connectionId
                                                );
                                            } else if (
                                                status.ignored &&
                                                !status.checked &&
                                                tagManager
                                            ) {
                                                const ignoreTag =
                                                    tagManager.createTagData();
                                                ignoreTag.typeId = "ignore";
                                                ignoreTag.checkName = check;
                                                ignoreTag.tagId = `${check}-ignore`;
                                                tagManager.removeTag(
                                                    ignoreTag,
                                                    connection.connection
                                                        .slotInfo.connectionId
                                                );
                                            }
                                            setShowDetails(false);
                                        }}
                                    >
                                        <Icon
                                            type={
                                                status.ignored ? "add" : "block"
                                            }
                                            fontSize="12pt"
                                        ></Icon>
                                    </GhostButton>
                                )}
                                <GhostButton
                                    $tiny
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        let found = false;
                                        status.tags?.forEach((tag) => {
                                            if (tag.tagId === `${check}-star`) {
                                                found = true;
                                            }
                                        });
                                        if (tagManager && !found) {
                                            const starTag =
                                                tagManager.createTagData();
                                            starTag.typeId = "star";
                                            starTag.checkName = check;
                                            starTag.tagId = `${check}-star`;
                                            tagManager.addTag(
                                                starTag,
                                                connection.connection.slotInfo
                                                    .connectionId
                                            );
                                        } else if (tagManager && found) {
                                            const starTag =
                                                tagManager.createTagData();
                                            starTag.typeId = "star";
                                            starTag.checkName = check;
                                            starTag.tagId = `${check}-star`;
                                            tagManager.removeTag(
                                                starTag,
                                                connection.connection.slotInfo
                                                    .connectionId
                                            );
                                        }
                                        setShowDetails(false);
                                    }}
                                >
                                    <Icon type={"star"} fontSize="12pt"></Icon>
                                </GhostButton>
                            </>
                        )}
                    </span>
                    {showDetails &&
                        status.tags.map((tag) => (
                            <Fragment key={tag.tagId}>
                                <br />
                                <div
                                    key={tag.tagId}
                                    style={{
                                        marginLeft: "1rem",
                                        color:
                                            tag.type.textColor ?? textPrimary,
                                        textDecoration: "none",
                                        display: "inline-block",
                                    }}
                                >
                                    <Icon
                                        fontSize="14px"
                                        type={tag.type.icon}
                                        style={{
                                            color:
                                                tag.type.iconColor ??
                                                textPrimary,
                                        }}
                                    />{" "}
                                    {tag.text ?? tag.type.displayName}
                                </div>
                            </Fragment>
                        ))}
                </div>
            )}
        </>
    );
};

export default CheckView;
