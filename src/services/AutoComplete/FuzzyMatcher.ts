// Based on https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
const computeDLDistance = (a: string, b: string): number => {
    const itemPositions: Record<string, number> = {};
    const distances: Uint32Array[] = [];
    for (let x = 0; x < a.length + 2; x++) {
        distances.push(new Uint32Array(b.length + 2));
    }
    const maxDist = a.length + b.length;
    distances[0][0] = maxDist;

    for (let i = 0; i < a.length + 1; i++) {
        distances[i + 1][0] = maxDist;
        distances[i + 1][1] = i;
    }
    for (let j = 0; j < b.length + 1; j++) {
        distances[0][j + 1] = maxDist;
        distances[1][j + 1] = j;
    }
    for (let i = 0; i < a.length; i++) {
        let db = -1;
        for (let j = 0; j < b.length; j++) {
            let cost = 1;
            const k = itemPositions[b[j]] ?? -1;
            const l = db;
            if (a[i] === b[j]) {
                cost = 0;
                db = j;
            }

            distances[i + 2][j + 2] = Math.min(
                distances[i + 1][j + 1] + cost, // substitution
                distances[i + 2][j + 1] + 1, // insertion
                distances[i + 1][j + 2] + 1, // deletion
                distances[k + 1][l + 1] + (i - k - 1) + cost + (j - l - 1) // transposition
            );
            // console.log(k, l, itemPositions, distances);
        }
        itemPositions[a[i]] = i;
    }
    // console.log(distances)
    return distances[a.length + 1][b.length + 1];
};

// based on ap code https://github.com/ArchipelagoMW/Archipelago/blob/9b64e832874a50d5d14d5bc599d356d2c5194d7a/Utils.py#L676
const fuzzyMatchScore = (a: string, b: string) => {
    if (a === b) {
        return 1.01;
    }
    return (
        1 -
        computeDLDistance(a.toLowerCase(), b.toLowerCase()) /
            Math.max(a.length, b.length)
    );
};


export { fuzzyMatchScore };
