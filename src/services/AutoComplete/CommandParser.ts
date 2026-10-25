// Used to parse potential archipelago commands, tries to mimic a simple POSIX parser, without special characters

// A Definite Finite Automata
type DFAResp = {
    next: (c: string, c2: string) => DFAResp;
    accept?: boolean;
    strip?: boolean;
};
// Quoted Escaped character
const arg_esc_q = (_c: string, _c2: string): DFAResp => ({ next: arg_dbq });
// Escaped character
const arg_esc = (_c: string, _c2: string): DFAResp => ({ next: arg });
// Double quoted argument
const arg_dbq = (c: string, c2: string): DFAResp => {
    if (c === '"') return { next: arg, strip: true };
    if (c === "\\" && ['"', "\\"].includes(c2))
        return { next: arg_esc_q, strip: true };
    return { next: arg_dbq };
};
// Single quoted argument
const arg_sq = (c: string, _c2: string): DFAResp => {
    if (c === "'") return { next: arg, strip: true };
    return { next: arg_sq };
};

// command argument
const arg = (c: string, _c2: string): DFAResp => {
    if (c === '"') return { next: arg_dbq, strip: true };
    if (c === "'") return { next: arg_sq, strip: true };
    if (c === "\\") return { next: arg_esc, strip: true };
    if (c === " ") return { next: arg, accept: true, strip: true };
    return { next: arg };
};
// command name
const cmd_name = (c: string, _c2: string): DFAResp => {
    if (![" ", '"', "'"].includes(c)) return { next: cmd_name };
    if (c === " ") return { next: arg, accept: true, strip: true };
    return null;
};
// start of string
const start = (c: string, _c2: string): DFAResp => {
    if (["!", "/"].includes(c)) return { next: cmd_name };
    return null;
};

const parseCommandString = (input: string) => {
    let index = 0;
    let token = "";
    let results: string[] = [];
    let next = start;
    while (index < input.length && next) {
        // console.log(next.name)
        const c = input[index];
        const c2 = index + 1 < input.length ? input[index + 1] : "";
        const nodeResults = next(c, c2);
        if (nodeResults?.accept) {
            results.push(token);
            token = "";
        }
        if (!nodeResults?.strip) {
            token += c;
        }
        next = nodeResults?.next;
        index++;
    }
    if (token) {
        results.push(token);
    }

    return results;
};

export { parseCommandString };
