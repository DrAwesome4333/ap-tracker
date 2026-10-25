import { MultiWorldContextData } from "../MultiInfo/MultiWorldContextData";
import { fuzzyMatchScore } from "./FuzzyMatcher";

const fuzzyMatchSort = (items: string[], input: string) => {
    const scores = {};
    items.forEach((item) => {
        const score = fuzzyMatchScore(input, item);
        scores[item] = score;
    });
    items.sort((a, b) => scores[b] - scores[a]);
    return items;
};

const fuzzyMatchSortAsync = (
    items: string[],
    input: string,
    signal: AbortSignal
): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const scores = {};
        const workSize = 1000;
        let workIndex = 0;
        const doWork = () => {
            if (signal.aborted) {
                reject(new Error("Aborted"));
                return;
            }
            let workCounter = 0;
            while (workCounter < workSize && workIndex < items.length) {
                const item = items[workIndex];
                scores[item] = fuzzyMatchScore(input, item);
                workCounter++;
                workIndex++;
            }
            if (workIndex >= items.length) {
                items.sort((a, b) => scores[b] - scores[a]);
                resolve(items);
                return;
            } else {
                requestAnimationFrame(doWork);
            }
        };
        doWork();
    });
};

const playerSearch = (
    input: string,
    multiWorldContext: MultiWorldContextData,
    includeGroups: boolean
) => {
    const playerInput = input.trim().toLowerCase();
    let results = [
        ...Object.values(multiWorldContext.players)
            .filter(
                (player) =>
                    player.name.toLocaleLowerCase().startsWith(playerInput) ||
                    player.alias?.toLowerCase().startsWith(playerInput)
            )
            .map((player) => player.name),
    ];
    if (includeGroups) {
        results = [
            ...results,
            ...Object.values(multiWorldContext.groups)
                .filter((group) =>
                    group.name.toLocaleLowerCase().startsWith(playerInput)
                )
                .map((group) => group.name),
        ];
    }
    return results;
};

const locationSearch = (
    input: string,
    game: string,
    multiWorldContext: MultiWorldContextData,
    includeGroups: boolean
) => {
    const locationNames =
        multiWorldContext.gamePackages[game]?.getAllLocationNames();
    if (!includeGroups) {
        return fuzzyMatchSort(locationNames, input);
    }
    const locationGroupNames = Object.keys(
        multiWorldContext.gamePackages[game]?.getLocationGroups() ?? {}
    );
    return fuzzyMatchSort([...locationNames, ...locationGroupNames], input);
};

const itemSearch = (
    input: string,
    game: string,
    multiWorldContext: MultiWorldContextData,
    includeGroups: boolean
) => {
    const itemNames = multiWorldContext.gamePackages[game]?.getAllItemNames();
    if (!includeGroups) {
        return fuzzyMatchSort(itemNames, input);
    }
    const itemGroupNames = Object.keys(
        multiWorldContext.gamePackages[game]?.getItemGroups() ?? {}
    );
    return fuzzyMatchSort([...itemNames, ...itemGroupNames], input);
};

const locationSearchAsync = async (
    input: string,
    game: string,
    multiWorldContext: MultiWorldContextData,
    includeGroups: boolean,
    signal: AbortSignal
) => {
    const locationNames =
        multiWorldContext.gamePackages[game]?.getAllLocationNames();
    if (!includeGroups) {
        return await fuzzyMatchSortAsync(locationNames, input, signal);
    }
    const locationGroupNames = Object.keys(
        multiWorldContext.gamePackages[game]?.getLocationGroups() ?? {}
    );
    return await fuzzyMatchSortAsync(
        [...locationNames, ...locationGroupNames],
        input,
        signal
    );
};

const itemSearchAsync = async (
    input: string,
    game: string,
    multiWorldContext: MultiWorldContextData,
    includeGroups: boolean,
    signal: AbortSignal
) => {
    const itemNames = multiWorldContext.gamePackages[game]?.getAllItemNames();
    if (!includeGroups) {
        return await fuzzyMatchSortAsync(itemNames, input, signal);
    }
    const itemGroupNames = Object.keys(
        multiWorldContext.gamePackages[game]?.getItemGroups() ?? {}
    );
    return await fuzzyMatchSortAsync(
        [...itemNames, ...itemGroupNames],
        input,
        signal
    );
};
export {
    playerSearch,
    locationSearch,
    itemSearch,
    locationSearchAsync,
    itemSearchAsync,
};
