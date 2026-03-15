enum ConnectorEventType {
    connecting = "connecting",
    connectionSuccess = "connection_success",
    connectionFailed = "connection_failed",
    generalError = "general_error",
    validationError = "validation_error",
    connectionLost = "connection_lost",
    disconnect = "disconnect",
}

enum ConnectorValidationError {
    alreadyConnected = "already_connected",
    alreadyConnecting = "already_connecting",
    invalidHost = "invalid_host",
    invalidPort = "invalid_port",
    invalidSlotName = "invalid_slot_name",
    slotNotFound = "slot_not_found",
}

type ConnectorEventArgs = {
    host?: string;
    port?: string;
    slot?: string;
    slotAlias?: string;
    game?: string;
    error?: Error;
    apError?: unknown;
};

type ConnectorEventHandler = (
    type: ConnectorEventType,
    args: ConnectorEventArgs
) => void;

// const MessageTemplates = {
//     alreadyConnected: (): ConnectionMessage => ({
//         type: MessageType.info,
//         message: "Already connected to multiworld server."
//     }),
//     alreadyConnecting: (): ConnectionMessage => ({
//         type: MessageType.info,
//         message: "Already trying to connect to multiworld server."
//     }),
//     connectionSuccess: ({playerAlias, game}): ConnectionMessage => ({
//         type: MessageType.success,
//         message: `Connected as ${playerAlias} playing ${game}.`
//     }),
//     connectionFailed: ({host, port, slot, error}): ConnectionMessage => {
//         let additionalHelp = "";
//         if(['localhost', '127.0.0.1'].includes(host)){
//             additionalHelp =
// `Please verify your local server is running on port ${port}.
// You can check the port in the server's console.`
//         } else if (process.env.DEFAULT_HOST === host) {
//             additionalHelp =
// `Please double check the port number on your room is still ${port} and that your room on ${host} is awake.
// You can refresh the room to wake up the server if it has fallen asleep.
// If the port has changed, you can update the port in this app by hitting the edit icon by a slot.`
//         } else if (window.isSecureContext && window.location.hostname !== 'localhost') {
//             additionalHelp =
// `Please double check the correct information is ${host}:${port}.
// If this is correct and the server is running and reachable, your browser
// may be blocking the request for security reasons if the server does not support secured websockets.
// To use this tracker in cases like this, you will need to host it locally.
// See the help section in the settings.`
//         } else {
//             additionalHelp =
// `Please double check the correct information is ${host}:${port}.`
//         }

//         let message = "Failed to connect to server";
//         let details = additionalHelp;
//         if (error.errors) {
//             const e = error.errors[0];
//             switch (e) {
//                 case "InvalidSlot": {
//                     message = `Failed to connect to slot. The slot name "${slot}" was invalid.`;
//                     details = `An Archipelago server was running at ${host}:${port}, but "${slot}" was not a player in that server.
// Please verify you have the correct slot details.`;
//                     break;
//                 }
//                 default: {
//                     message = `Failed to connect to slot. Reason: ${e}`;
//                 }
//             }
//         }
//         details += `\n\nOriginal Error:\n\t${error}`;
//         return {
//             type: MessageType.error,
//             message,
//             details,
//         };
//     },
//     generalError: ({message, details}): ConnectionMessage => ({
//             type: MessageType.error,
//             message,
//             details,
//     }),

// }

export { ConnectorEventType, ConnectorValidationError };
export type { ConnectorEventArgs, ConnectorEventHandler };
