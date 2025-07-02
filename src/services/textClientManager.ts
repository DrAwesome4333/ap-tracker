import {
    Client,
    Item,
    MessageNode,
    Player,
    ValidJSONColorType,
} from "archipelago.js";
import { globalOptionManager } from "./options/optionManager";
import { randomUUID } from "../utility/uuid";
interface APMessage {
    parts: (MessageNode | EchoMessageNode)[];
    key: string;
}

interface EchoMessageNode {
    type: "echo";
    text: string;
    color: ValidJSONColorType;
}

type SimpleMessageType =
    | "command"
    | "chat"
    | "status"
    | "login"
    | "misc"
    | "item";
type ItemType = "trap" | "progression" | "useful" | "normal";
type MessageFilter = {
    allowedTypes: SimpleMessageType[];
    itemSendFilter: {
        own: ItemType[];
        others: ItemType[];
    };
};

const messageTypeCategoryMap = {
    adminCommand: "command",
    userCommand: "command",
    chat: "chat",
    serverChat: "chat",
    collected: "status",
    released: "status",
    goaled: "status",
    tagsUpdated: "status",
    connected: "login",
    disconnected: "login",
    tutorial: "misc",
    countdown: "misc",
    itemCheated: "item",
    itemHinted: "item",
    itemSent: "item",
};

class TextClientManager {
    #messages: APMessage[] = [];
    #history: string[] = [];
    #messageListeners: Set<() => void> = new Set();
    #historyListeners: Set<() => void> = new Set();
    messageBufferTrimToSize = 1000;
    messageBufferMaxSize = 1500;
    listenerDelay = 10;
    #timeout = 0;

    #callHistoryListeners = () => {
        this.#historyListeners.forEach((listener) => listener());
    };

    #callMessageListeners = () => {
        if (!this.#timeout) {
            this.#timeout = window.setTimeout(() => {
                this.#messageListeners.forEach((listener) => listener());
                this.#timeout = 0;
            }, this.listenerDelay);
        }
    };

    /** Appends a message of a specific color/style */
    echo = (message: string, color: ValidJSONColorType) => {
        const parts: EchoMessageNode[] = [
            {
                type: "echo",
                text: message,
                color: color,
            },
        ];
        const apMessage: APMessage = {
            key: randomUUID(),
            parts,
        };
        this.#messages = [...this.#messages, apMessage];
        if (this.#messages.length >= this.messageBufferMaxSize) {
            this.#messages = [
                ...this.#messages.slice(
                    this.#messages.length - this.messageBufferTrimToSize
                ),
            ];
        }
        this.#callMessageListeners();
    };

    #isMessageWanted = (
        { type, item }: { type: string; player?: Player; item?: Item },
        client: Client
    ): boolean => {
        const messageFilter: MessageFilter = globalOptionManager.getOptionValue(
            "TextClient:message_filter",
            "global"
        ) as MessageFilter;
        const simplifiedType: SimpleMessageType = messageTypeCategoryMap[type];

        if (!messageFilter.allowedTypes.includes(simplifiedType)) {
            return false;
        }

        if (simplifiedType === "item" && item) {
            const self = client.players.self;
            let matches = false;
            if (
                (item.receiver.slot === self.slot &&
                    item.receiver.team === self.team) ||
                (item.sender.slot === self.slot &&
                    item.sender.team === self.team)
            ) {
                if (
                    item.progression &&
                    messageFilter.itemSendFilter.own.includes("progression")
                ) {
                    matches = true;
                } else if (
                    item.useful &&
                    messageFilter.itemSendFilter.own.includes("useful")
                ) {
                    matches = true;
                } else if (
                    item.trap &&
                    messageFilter.itemSendFilter.own.includes("trap")
                ) {
                    matches = true;
                } else if (
                    item.filler &&
                    messageFilter.itemSendFilter.own.includes("normal")
                ) {
                    matches = true;
                }
            } else {
                if (
                    item.progression &&
                    messageFilter.itemSendFilter.others.includes("progression")
                ) {
                    matches = true;
                } else if (
                    item.useful &&
                    messageFilter.itemSendFilter.others.includes("useful")
                ) {
                    matches = true;
                } else if (
                    item.trap &&
                    messageFilter.itemSendFilter.others.includes("trap")
                ) {
                    matches = true;
                } else if (
                    item.filler &&
                    messageFilter.itemSendFilter.others.includes("normal")
                ) {
                    matches = true;
                }
            }
            return matches;
        }
        return true;
    };

    #addMessage = (nodes: MessageNode[]) => {
        const parts = nodes;
        const apMessage: APMessage = {
            key: randomUUID(),
            parts,
        };
        this.#messages = [...this.#messages, apMessage];
        if (this.#messages.length >= this.messageBufferMaxSize) {
            this.#messages = [
                ...this.#messages.slice(
                    this.#messages.length - this.messageBufferTrimToSize
                ),
            ];
        }
        this.#callMessageListeners();
    };

    addMessage = (type: string, nodes: MessageNode[], client: Client) => {
        if (!this.#isMessageWanted({ type }, client)) {
            return;
        }
        this.#addMessage(nodes);
    };

    addPlayerMessage = (
        type: string,
        player: Player,
        nodes: MessageNode[],
        client: Client
    ) => {
        if (!this.#isMessageWanted({ type, player }, client)) {
            return;
        }
        this.#addMessage(nodes);
    };

    addItemMessage = (
        type: string,
        item: Item,
        nodes: MessageNode[],
        client: Client
    ) => {
        if (!this.#isMessageWanted({ type, item }, client)) {
            return;
        }
        this.#addMessage(nodes);
    };

    getMessages = () => {
        return this.#messages;
    };

    getHistory = () => {
        return this.#history;
    };

    processCommand = (text: string) => {
        this.echo(text, "underline");
        switch (text) {
            case "help": {
                this.echo("Available commands:", null);
                this.echo("/help: Display this helpful message", null);
                break;
            }
            default: {
                this.echo(
                    `Unrecognized command: ${text}, run /help for a list of available commands`,
                    "red"
                );
                break;
            }
        }
    };

    processInput = async (text: string, client: Client) => {
        if (!text) {
            return;
        }
        this.#history = [text, ...this.#history];
        this.#callHistoryListeners();

        if (text.startsWith("/")) {
            return this.processCommand(text.substring(1));
        }
        await client.messages.say(text);
    };

    /**
     * Creates a callback that can be used to subscribe to new messages
     * @returns A callback that accepts a listener callback as a parameter and returns a clean up callback.
     */
    getMessageSubscriber = (): ((listener: () => void) => () => void) => {
        return (listener) => {
            this.#messageListeners.add(listener);
            return () => {
                // Clean up callback
                this.#messageListeners.delete(listener);
            };
        };
    };

    /**
     * Creates a callback that can be used to subscribe to new history
     * @returns A callback that accepts a listener callback as a parameter and returns a clean up callback.
     */
    getHistorySubscriber = (): ((listener: () => void) => () => void) => {
        return (listener) => {
            this.#historyListeners.add(listener);
            return () => {
                // Clean up callback
                this.#historyListeners.delete(listener);
            };
        };
    };
}

export default TextClientManager;
export type {
    APMessage,
    MessageNode,
    EchoMessageNode,
    MessageFilter,
    SimpleMessageType,
    ItemType,
};
