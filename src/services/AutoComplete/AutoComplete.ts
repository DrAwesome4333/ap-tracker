import {
    MultiWorldContextData,
    MultiWorldContextHelper,
} from "../MultiInfo/MultiWorldContextData";
import { parseCommandString } from "./CommandParser";
import { escapeArg } from "./Escape";
import { itemSearchAsync, locationSearchAsync, playerSearch } from "./Search";

const searchCommandFactory = (
    commandText: string,
    searchFunction: (
        input: string,
        game: string,
        multiWorldContext: MultiWorldContextData,
        includeGroups: boolean,
        signal: AbortSignal
    ) => Promise<string[]>,
    includeGroups: boolean
) => {
    return async (
        _input: string[],
        raw_input: string,
        multiWorldContext: MultiWorldContextData,
        signal: AbortSignal
    ) => {
        const searchText = raw_input.slice(commandText.length).trim();
        const game = MultiWorldContextHelper.getSlotGame(
            multiWorldContext,
            multiWorldContext.trackedSlot
        );
        const searchResults = await searchFunction(
            searchText,
            game,
            multiWorldContext,
            includeGroups,
            signal
        );
        const results = searchResults.map((x) => `${commandText} ${x}`);
        return results;
    };
};

const hintComplete = searchCommandFactory("!hint", itemSearchAsync, true);
const getItemComplete = searchCommandFactory(
    "!getitem",
    itemSearchAsync,
    false
);
const hintLocationComplete = searchCommandFactory(
    "!hint_location",
    locationSearchAsync,
    true
);

// admin commands
const playerCommandFactory = (commandText: string, includeGroups: boolean) => {
    return (
        _input: string[],
        raw_input: string,
        multiWorldContext: MultiWorldContextData
    ) => {
        const searchText = raw_input.slice(commandText.length).trim(); // archipelago does not use command parsing here
        const searchResults = playerSearch(
            searchText,
            multiWorldContext,
            includeGroups
        );
        const results = searchResults.map((x) => `${commandText} ${x}`);
        return results;
    };
};

const collectComplete = playerCommandFactory("!admin /collect", false);
const releaseComplete = playerCommandFactory("!admin /release", false);
const forbidReleaseComplete = playerCommandFactory(
    "!admin /forbid_release",
    false
);
const allowReleaseComplete = playerCommandFactory(
    "!admin /allow_release",
    false
);

const aliasComplete = (
    _input: string[],
    raw_input: string,
    context: MultiWorldContextData
): string[] => {
    const prefix = "!admin /alias";
    const parts = raw_input.slice(prefix.length).trim().split(" ");
    if (parts.length > 1) {
        // TODO, improve this case
        return [];
    }
    const searchText = parts[0]; // AP server side code only looks up to the first space, treating the rest as the alias
    // TODO, apply fuzzy matching
    const possiblePlayers = playerSearch(searchText, context, false);
    const results = possiblePlayers.map(
        (p) => `${prefix} ${p.replace(" ", "_")}`
    );

    return results;
};

const sendMultipleComplete = async (
    input: string[],
    _raw_input: string,
    context: MultiWorldContextData,
    signal: AbortSignal
) => {
    if (input.length < 2) {
        // no count yet
        return ["!admin /send_multiple"];
    }

    const count = Number.parseInt(input[1]);
    if (!Number.isFinite(count) || count <= 0) {
        return ["!admin /send_multiple"];
    }

    let playerSlot = -1;
    if (input.length < 4) {
        // have count but no item name, help search for player
        const playerSearchText = input[2] ?? "";
        const playerSearchResults = playerSearch(
            playerSearchText,
            context,
            false
        );
        if (!playerSearchResults.some((p) => p === playerSearchText)) {
            return playerSearchResults.map(
                (p) => `!admin /send_multiple ${count} ${escapeArg(p)}`
            );
        }
    }
    playerSlot = MultiWorldContextHelper.getSlotNumber(context, input[2]);
    console.log(playerSlot);
    if (playerSlot && playerSlot > 0) {
        const game = MultiWorldContextHelper.getSlotGame(context, playerSlot);
        const itemSearchText = input.slice(3).join(" ") ?? "";
        const itemSearchResults = await itemSearchAsync(
            itemSearchText,
            game,
            context,
            true,
            signal
        );
        return itemSearchResults.map(
            (i) =>
                `!admin /send_multiple ${count} ${escapeArg(input[2])} ${escapeArg(i)}`
        );
    }
    return [`!admin /send_multiple ${count}`];
};

const sendComplete = async (
    input: string[],
    _raw_input: string,
    context: MultiWorldContextData,
    signal: AbortSignal
) => {
    let playerSlot = -1;
    if (input.length < 3) {
        // help search for player
        const playerSearchText = input[1] ?? "";
        const playerSearchResults = playerSearch(
            playerSearchText,
            context,
            false
        );
        if (!playerSearchResults.some((p) => p === playerSearchText)) {
            return playerSearchResults.map(
                (p) => `!admin /send ${escapeArg(p)}`
            );
        }
    }
    playerSlot = MultiWorldContextHelper.getSlotNumber(context, input[1]);
    if (playerSlot && playerSlot > 0) {
        const game = MultiWorldContextHelper.getSlotGame(context, playerSlot);
        const itemSearchText = input.slice(2).join(" ") ?? "";
        const itemSearchResults = await itemSearchAsync(
            itemSearchText,
            game,
            context,
            true,
            signal
        );
        return itemSearchResults.map(
            (i) => `!admin /send ${escapeArg(input[1])} ${escapeArg(i)}`
        );
    }
    return [`!admin /send`];
};

const sendLocationComplete = async (
    input: string[],
    _raw_input: string,
    context: MultiWorldContextData,
    signal: AbortSignal
) => {
    let playerSlot = -1;
    if (input.length < 3) {
        // help search for player
        const playerSearchText = input[1] ?? "";
        const playerSearchResults = playerSearch(
            playerSearchText,
            context,
            false
        );
        if (!playerSearchResults.some((p) => p === playerSearchText)) {
            return playerSearchResults.map(
                (p) => `!admin /send_location ${escapeArg(p)}`
            );
        }
    }
    playerSlot = MultiWorldContextHelper.getSlotNumber(context, input[1]);
    if (playerSlot && playerSlot > 0) {
        const game = MultiWorldContextHelper.getSlotGame(context, playerSlot);
        const locationSearchText = input.slice(2).join(" ") ?? "";
        const locationSearchResults = await locationSearchAsync(
            locationSearchText,
            game,
            context,
            false,
            signal
        );
        return locationSearchResults.map(
            (i) =>
                `!admin /send_location ${escapeArg(input[1])} ${escapeArg(i)}`
        );
    }
    return [`!admin /send_location`];
};

const adminHintComplete = async (
    input: string[],
    _raw_input: string,
    context: MultiWorldContextData,
    signal: AbortSignal
) => {
    let playerSlot = -1;
    if (input.length < 3) {
        // help search for player
        const playerSearchText = input[1] ?? "";
        const playerSearchResults = playerSearch(
            playerSearchText,
            context,
            false
        );
        if (!playerSearchResults.some((p) => p === playerSearchText)) {
            return playerSearchResults.map(
                (p) => `!admin /hint ${escapeArg(p)}`
            );
        }
    }
    playerSlot = MultiWorldContextHelper.getSlotNumber(context, input[1]);
    if (playerSlot && playerSlot > 0) {
        const game = MultiWorldContextHelper.getSlotGame(context, playerSlot);
        const itemSearchText = input.slice(2).join(" ") ?? "";
        const itemSearchResults = await itemSearchAsync(
            itemSearchText,
            game,
            context,
            true,
            signal
        );
        return itemSearchResults.map(
            (i) => `!admin /hint ${escapeArg(input[1])} ${escapeArg(i)}`
        );
    }
    return [`!admin /hint`];
};

const adminHintLocationComplete = async (
    input: string[],
    _raw_input: string,
    context: MultiWorldContextData,
    signal: AbortSignal
) => {
    let playerSlot = -1;
    if (input.length < 3) {
        // help search for player
        const playerSearchText = input[1] ?? "";
        const playerSearchResults = playerSearch(
            playerSearchText,
            context,
            false
        );
        if (!playerSearchResults.some((p) => p === playerSearchText)) {
            return playerSearchResults.map(
                (p) => `!admin /hint_location ${escapeArg(p)}`
            );
        }
    }
    playerSlot = MultiWorldContextHelper.getSlotNumber(context, input[1]);
    if (playerSlot && playerSlot > 0) {
        const game = MultiWorldContextHelper.getSlotGame(context, playerSlot);
        const locationSearchText = input.slice(2).join(" ") ?? "";
        const locationSearchResults = await locationSearchAsync(
            locationSearchText,
            game,
            context,
            true,
            signal
        );
        return locationSearchResults.map(
            (i) =>
                `!admin /hint_location ${escapeArg(input[1])} ${escapeArg(i)}`
        );
    }
    return [`!admin /hint_location`];
};

const optionValues: Record<string, string[]> = {
    hint_cost: null,
    location_check_points: null,
    server_password: null,
    password: null,

    release_mode: ["goal", "enabled", "disabled", "auto", "auto_enabled"],
    remaining_mode: ["goal", "enabled", "disabled"],
    collect_mode: ["goal", "enabled", "disabled", "auto", "auto_enabled"],
    countdown_mode: ["enabled", "disabled", "auto"],
    item_cheat: ["off", "on"],
    compatibility: ["0", "1", "2"],
};

const optionComplete = (
    input: string[],
    _raw_input: string,
    _context: MultiWorldContextData
): string[] => {
    const option = input[1]?.toLowerCase() ?? "";
    if (!Object.keys(optionValues).includes(option)) {
        return Object.keys(optionValues)
            .filter((o) => o.startsWith(option))
            .map((o) => `!admin /option ${o}`);
    }
    const values = optionValues[option];
    if (values) {
        return values.map((v) => `!admin /option ${option} ${v}`);
    }
    return [`!admin /option ${option}`];
};
// raw means the command uses raw input rather than a broken down command
const adminCommands: Record<
    string,
    (
        input: string[],
        raw_input: string,
        context: MultiWorldContextData,
        signal?: AbortSignal
    ) => Promise<string[]> | string[]
> = {
    // No predictable arg commands
    login: null,
    "/help": null,
    "/license": null,
    "/options": null,
    "/players": null,
    "/save": null,
    "/exit": null,
    "/countdown": null,
    // player only arg commands
    "/collect": collectComplete, // raw
    "/release": releaseComplete, // raw
    "/forbid_release": forbidReleaseComplete, // raw
    "/allow_release": allowReleaseComplete, // raw

    "/alias": aliasComplete, // raw
    "/send": sendComplete,
    "/send_multiple": sendMultipleComplete,
    "/send_location": sendLocationComplete,
    "/hint": adminHintComplete,
    "/hint_location": adminHintLocationComplete,
    "/option": optionComplete,
};

const adminBaseList = Object.keys(adminCommands);
Object.freeze(adminBaseList);

const adminComplete = async (
    input: string[],
    raw_input: string,
    multiWorldContext: MultiWorldContextData,
    signal: AbortSignal
) => {
    const secondaryCommand = input[1]?.toLowerCase() ?? "";
    for (const command of Object.keys(adminCommands)) {
        if (secondaryCommand === command) {
            return (
                (await adminCommands[command]?.(
                    input.splice(1),
                    raw_input,
                    multiWorldContext,
                    signal
                )) ?? []
            );
        }
    }

    return adminBaseList
        .filter((cmd) => cmd.startsWith(secondaryCommand))
        .map((x) => `!admin ${x}`);
};

const clientCommands: Record<
    string,
    (
        input: string[],
        raw_input: string,
        context: MultiWorldContextData,
        signal?: AbortSignal
    ) => string[] | Promise<string[]>
> = {
    "!help": null,
    "!license": null,
    "!options": null,
    "!players": null,
    "!status": null,
    "!countdown": null,
    "!alias": null,
    "!admin": adminComplete,
    "!remaining": null,
    "!missing": null,
    "!checked": null,
    "!hint": hintComplete,
    "!hint_location": hintLocationComplete,
    "!collect": null,
    "!release": null,
    "!getitem": getItemComplete,
    "/help": null,
};

const baseList = Object.keys(clientCommands);
Object.freeze(baseList);

const autoComplete = async (
    input: string,
    multiWorldContext: MultiWorldContextData,
    signal: AbortSignal
): Promise<string[]> => {
    //check for command match
    const commandArgs = parseCommandString(input);
    const lowerInput = commandArgs[0]?.toLowerCase() ?? "";
    // console.log("parse result", commandArgs);
    for (const command of Object.keys(clientCommands)) {
        if (lowerInput === command) {
            if (!clientCommands[command]) {
                return [command];
            }
            return (
                (await clientCommands[command](
                    commandArgs,
                    input,
                    multiWorldContext,
                    signal
                )) ?? []
            );
        }
    }
    return input.startsWith("!") || input.startsWith("/")
        ? baseList.filter((cmd) => cmd.startsWith(lowerInput))
        : [];
};

const hintAutoComplete = async (
    input: string,
    game: string,
    context: MultiWorldContextData,
    signal: AbortSignal
) => {
    return await itemSearchAsync(input, game, context, true, signal);
};

export { autoComplete, hintAutoComplete };
