import {
    ConnectorEventHandler,
    ConnectorEventType,
} from "./services/connector/connectorMessages";
import NotificationManager, {
    StatusNotificationHandle,
    MessageType,
} from "./services/notifications/notifications";

let statusMessageHandle: StatusNotificationHandle;

const connectorEventHandler: ConnectorEventHandler = (
    eventType,
    { host, port, slotAlias, error, slot, apError }
) => {
    switch (eventType) {
        case ConnectorEventType.connecting: {
            if (statusMessageHandle) {
                statusMessageHandle.update({ duration: 0 });
            }
            statusMessageHandle = NotificationManager.createStatus({
                message: `Connecting to server ...`,
                type: MessageType.progress,
                id: "ap-connection",
            });
        }
        case ConnectorEventType.connectionFailed: {
            if (statusMessageHandle) {
                statusMessageHandle.update({
                    type: MessageType.error,
                    message: "Failed to connect",
                    duration: 10,
                    progress: 1,
                });
                statusMessageHandle = null;
            }
            let additionalHelp = "";
            if (["localhost", "127.0.0.1"].includes(host)) {
                additionalHelp = `Please verify your local server is running on port ${port}. 
You can check the port in the server's console.`;
            } else if (process.env.DEFAULT_HOST === host) {
                additionalHelp = `Please double check the port number on your room is still ${port} and that your room on ${host} is awake.
You can refresh the room to wake up the server if it has fallen asleep. 
If the port has changed, you can update the port in this app by hitting the edit icon by a slot.`;
            } else if (
                window.isSecureContext &&
                window.location.hostname !== "localhost"
            ) {
                additionalHelp = `Please double check the correct information is ${host}:${port}.
If this is correct and the server is running and reachable, your browser
may be blocking the request for security reasons if the server does not support secured websockets.
To use this tracker in cases like this, you will need to host it locally.
See the help section in the settings.`;
            } else {
                additionalHelp = `Please double check the correct information is ${host}:${port}.`;
            }

            let message = "Failed to connect to server";
            let details = additionalHelp;
            // @ts-ignore-error ap error is listed as unknown for now
            if (apError.errors) {
                // @ts-ignore-error
                const e = apError.errors[0];
                switch (e) {
                    case "InvalidSlot": {
                        message = `Failed to connect to slot. The slot name "${slot}" was invalid.`;
                        details = `An Archipelago server was running at ${host}:${port}, but "${slot}" was not a player in that server.
Please verify you have the correct slot details.`;
                        break;
                    }
                    default: {
                        message = `Failed to connect to slot. Reason: ${e}`;
                    }
                }
            }
            details += `\n\nOriginal Error:\n\t${apError}`;
        }
        case ConnectorEventType.generalError: {
        }
    }
};

const registerConnector = () => {};
const cleanUp = connector.onEvent(connectorEventHandler);
