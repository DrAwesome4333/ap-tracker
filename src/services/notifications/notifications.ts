enum MessageType {
    info = "info",
    progress = "progress",
    error = "error",
    warning = "warning",
    success = "success",
}

const randomId = () => {
    let result = "randomID-";
    for (let i = 0; i < 10; i++) {
        result += Math.floor(Math.random() * 10);
    }
    return result;
};

interface StatusNotification {
    type: MessageType;
    message: string;
    duration?: number;
    progress: number;
    id: string;
}

interface StatusNotificationUpdate {
    type?: MessageType;
    message?: string;
    duration?: number;
    progress?: number;
}

interface StatusNotificationHandle {
    update: (newInfo: StatusNotificationUpdate) => void;
}

interface ToastNotification {
    type: MessageType;
    message: string;
    details?: string;
    actionName?: string;
    action?: () => void;
    duration: number;
    id: string;
}
const NotificationManager = (() => {
    const statusListeners: Set<(status: StatusNotification) => void> =
        new Set();
    const toastListeners: Set<(toast: ToastNotification) => void> = new Set();
    /**
     *
     * @param {Object} params
     * @param {string} params.message
     * @param {string} [params.details]
     * @param {MessageType} params.type
     * @param {string} [params.id]
     * @param {number} [params.duration] Number of seconds message should pop up, defaults to 5
     */
    const createToast = ({
        message,
        type,
        details,
        id,
        action,
        actionName,
        duration = 7,
    }: {
        message: string;
        details?: string;
        type: MessageType;
        id?: string;
        duration?: number;
        action?: () => void;
        actionName?: string;
    }) => {
        const toast: ToastNotification = {
            type,
            message,
            details,
            duration: duration * 1000,
            id: id ?? randomId(),
            action,
            actionName,
        };

        toastListeners.forEach((listener) => {
            listener(toast);
        });
    };

    const addToastListener = (listener: (toast: ToastNotification) => void) => {
        toastListeners.add(listener);
    };

    const removeToastListener = (
        listener: (toast: ToastNotification) => void
    ) => {
        toastListeners.delete(listener);
    };

    /**
     *
     * @param {Object} params
     * @param {string} params.message
     * @param {MessageType} params.type
     * @param {string} [params.id]
     * @param {number} [params.duration] Number of seconds message should pop up, defaults to 5
     * @param {number} [params.progress] [0-1] on how much progress has been made, defaults to -1 (spinner)
     * @returns {StatusNotificationHandle}
     */
    const createStatus = ({
        message,
        type,
        id,
        duration,
        progress = -1,
    }: {
        message: string;
        type: MessageType;
        id?: string;
        duration?: number;
        progress?: number;
    }): StatusNotificationHandle => {
        /** @type {StatusNotification} */
        let status: StatusNotification = {
            type,
            message,
            progress,
            duration: duration === undefined ? undefined : duration * 1000,
            id: id ?? randomId(),
        };

        statusListeners.forEach((listener) => {
            listener(status);
        });

        return {
            update: (values) => {
                status = {
                    ...status,
                    ...values,
                    duration:
                        values.duration === undefined
                            ? undefined
                            : values.duration * 1000,
                };
                statusListeners.forEach((listener) => {
                    listener(status);
                });
            },
        };
    };

    const addStatusListener = (
        listener: (status: StatusNotification) => void
    ) => {
        statusListeners.add(listener);
    };

    const removeStatusListener = (
        listener: (status: StatusNotification) => void
    ) => {
        statusListeners.delete(listener);
    };

    return {
        createToast,
        addToastListener,
        removeToastListener,
        createStatus,
        addStatusListener,
        removeStatusListener,
        MessageType,
    };
})();

export default NotificationManager;
export { MessageType };
export type { ToastNotification, StatusNotification, StatusNotificationHandle };
