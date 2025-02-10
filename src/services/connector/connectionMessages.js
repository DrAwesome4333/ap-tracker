// @ts-check
import { MessageType } from "../notifications/notifications";

/**
 * @typedef ConnectionMessage
 * @prop {MessageType} type
 * @prop {string} message
 * @prop {string} [details]
 *
 */

const CONNECTION_MESSAGES = {
    alreadyConnected: () => ({
        type: MessageType.info,
        message: "Tracker is already connected to the archipelago server.",
    }),
    alreadyConnecting: () => ({
        type:  MessageType.info,
        message:
            "Tracker is already trying to connect to the archipelago server.",
    }),
    connectionSuccess: ({ playerAlias, game }) => ({
        type: MessageType.success,
        message: `Successfully connected as ${playerAlias} playing ${game}`,
    }),
    connectionFailed: ({ host, port, slot, game, error }) => {
        let serverHelp = "";
        switch(host){
            case "archipelago.gg": {
                serverHelp = `A common reason to not be able to connect to ${host} is the room has either gone to sleep (after 2 hours of inactivity) or the port has changed. 
                You can wake up the room by refreshing the room page and verify the port is still ${port}. 
                If the port has changed, you can change it by clicking a Saved Connection followed by the edit button.`;
                break;
            }
            case "localhost": // fallthrough
            case "127.0.0.1":
                {
                    serverHelp = `You seem to be trying to connect to a locally hosted Archipelago Server. Please verify the correct port is ${port}. 
                    You can verify this by looking at the server console to see what port it is running on. The default is 38281`;
                    break;
                }
            default:
                {
                    serverHelp = `You are trying to connect to the host: ${host}. Verify with the person running the server that it is up and running on the port ${port}.
                    If you are using the publicly hosted version of this tracker, it cannot connect to web sockets that are not secured due to web browser enforced policies on secured (https) websites.
                    To use the tracker you will need to host the tracker locally, instructions can be found at https://github.com/DrAwesome4333/ap-tracker in the readme section.`;
                    break;
                }
        }
        let message = `Failed to connect to server ${host}:${port}. Check connection details and ensure the server is running.`;
        let details = serverHelp;
        if (error.errors) {
            let e = error.errors[0];
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

        details += `\n\n Original Error:  ${error}`;
        return {
            type: MessageType.error,
            message,
            details,
        };
    },
    generalError: ({ message }) => ({
        type: MessageType.error,
        message,
    }),
};

export default CONNECTION_MESSAGES;
