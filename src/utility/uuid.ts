// Since the crypto module is not available in insecure contexts which this app may run in, there is a need for a home built UUID function.
/** Pseudo Randomly generate the bytes of a v4 UUID */

const randomUUIDBytes = () => {
    const numberBitSize = 8;
    const numberCount = 128 / numberBitSize;
    const bitArray = new Uint8Array(numberCount);
    for (let numberIndex = 0; numberIndex < numberCount; numberIndex++) {
        let byteValue = 0;
        for (let bit = 0; bit < numberBitSize; bit++) {
            byteValue <<= 1;
            byteValue |= Math.round(Math.random());
        }
        bitArray[numberIndex] = byteValue;
    }
    // Set the version field, in this case version 4
    // for pseudo randomly generated
    // https://www.rfc-editor.org/rfc/rfc9562#version_field
    bitArray[6] &= 0x0f;
    bitArray[6] |= 0x40;
    // Set the variant field to 10XX
    // https://www.rfc-editor.org/rfc/rfc9562#variant_field
    bitArray[8] &= 0b00111111;
    bitArray[8] |= 0b10000000;
    return bitArray;
};

// Similar to a UUID, but only 64 bits for space, base64 encoded with padding removed
const randomShortId = () => {
    const numberBitSize = 8;
    const numberCount = 64 / numberBitSize;
    const bitArray = new Uint8Array(numberCount);
    for (let numberIndex = 0; numberIndex < numberCount; numberIndex++) {
        let byteValue = 0;
        for (let bit = 0; bit < numberBitSize; bit++) {
            byteValue <<= 1;
            byteValue |= Math.round(Math.random());
        }
        bitArray[numberIndex] = byteValue;
    }
    const byteString = Array.from(bitArray, (x) =>
        String.fromCodePoint(x)
    ).join("");
    const base64string = btoa(byteString);
    // remove padding =
    return base64string.substring(0, base64string.length - 1);
};

/* converts a byte array to a UUID string */
const UUIDBytesToUUID = (bytes: Uint8Array) => {
    // Byte index for which dashes appear before
    const dashIndices = [4, 6, 8, 10];
    const uuid = bytes.reduce(
        (prev, cur, index) =>
            prev +
            (dashIndices.includes(index) ? "-" : "") +
            cur.toString(16).padStart(2, "0"),
        ""
    );
    return uuid;
};

/** Generates a random id between 0 and 2^53 - 1 */
const randomNumericId = () => {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
};

/** Pseudo Randomly generate a v4 UUID */
const randomUUID = () => {
    const byteArray = randomUUIDBytes();
    return UUIDBytesToUUID(byteArray);
};

export { randomUUID, randomShortId, randomNumericId };
