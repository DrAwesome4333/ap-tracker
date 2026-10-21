const escapeArg = (argument: string) => {
    const escapeRequiredChars = ["'", '"', " ", "\\"];
    const needsEscaping = escapeRequiredChars.some((c) => argument.includes(c));
    if (!needsEscaping) return argument;
    if (!argument.includes("'")) return `'${argument}'`;

    let result = "";
    let index = 0;
    while (index < argument.length) {
        const c = argument[index];
        if (['"', "\\"].includes(c)) result += "\\";
        result += c;
        index++;
    }
    return `"${result}"`;
};

export { escapeArg };
