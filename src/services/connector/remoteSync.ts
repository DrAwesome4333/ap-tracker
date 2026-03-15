import { Client } from "archipelago.js";

let client: Client = null;

const NOTE_KEY = "_tracker_note";

const saveNote = async (note: string) => {
    if (!client || !client.authenticated) {
        throw new Error(
            "Failed to save note, no connection to Archipelago Server."
        );
    }
    const key = `${NOTE_KEY}_${client.players.self.team}_${client.players.self.slot}`;
    await client.storage
        .prepare(key, { text: "", timestamp: Date.now() })
        .update({ text: note, timestamp: Date.now() })
        .commit();
};

const loadNote = async () => {
    if (!client || !client.authenticated) {
        throw new Error(
            "Failed to load note, no connection to Archipelago Server."
        );
    }
    const key = `${NOTE_KEY}_${client.players.self.team}_${client.players.self.slot}`;
    const value = await client.storage.fetch([key], true);
    return (value[key] ?? { text: "" })["text"];
};

const enableDataSync = (client_: Client) => {
    client = client_;
};

export { saveNote, loadNote, enableDataSync };
