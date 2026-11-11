import React from "react";
import { MessageType } from "@/services/notifications/notifications";
import Spinner from "@/components/icons/spinner";
import Icon from "@/components/icons/icons";
import styles from "./notification.module.css";

const StatusNotificationView = ({
    message,
    type,
    index,
    progress,
    hide,
}: {
    /** The text to display for the notification */
    message: string;
    /** The type of styling to apply to the message */
    type: MessageType;
    /** Determines the position of the notification on the screen */
    index: number;
    /** A value between 0 and 1 representing how much work has been done. Use -1 to create a spinner instead */
    progress: number;
    /** Makes the notification invisible and off screen, toggle this to animate the notification appearing/leaving */
    hide: boolean;
}) => {
    let boxColor = "grey";
    let iconColor = "grey";
    let icon = "info";
    switch (type) {
        case MessageType.error: {
            boxColor = "red";
            icon = "bomb";
            iconColor = "var(--danger-accent)";
            break;
        }
        case MessageType.info: {
            boxColor = "blue";
            icon = "info";
            iconColor = "#FFFFFF";
            break;
        }
        case MessageType.progress: {
            boxColor = "blue";
            icon = "";
            break;
        }
        case MessageType.success: {
            boxColor = "green";
            icon = "check_circle";
            iconColor = "#00AA00";
            break;
        }
        case MessageType.warning: {
            boxColor = "orange";
            icon = "warning";
            iconColor = "orange";
            break;
        }

        default: {
            boxColor = "grey";
            icon = "info";
            break;
        }
    }

    return (
        <div
            style={
                {
                    "--box-color": boxColor,
                    "--notification-index": index,
                } as React.CSSProperties
            }
            className={[
                styles.status_notification,
                hide ? styles.hidden : "",
            ].join(" ")}
            key="test"
        >
            <Spinner
                size={50}
                arc={progress < 0 ? 2 : Math.PI * 2 * progress}
                color="black"
                className={styles.notification_icon}
            />
            {icon && (
                <Icon
                    type={icon}
                    style={{
                        gridColumn: "1 / span 1",
                        gridRow: "1 /span 1",
                        justifySelf: "center",
                        alignSelf: "center",
                        textAlign: "center",
                        color: iconColor,
                    }}
                    fontSize="large"
                />
            )}

            <div className={styles.notification_content}>{message}</div>
        </div>
    );
};

export default StatusNotificationView;
