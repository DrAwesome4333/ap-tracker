/**
 *
 * @param fileName What to name the file, .json is automatically appended
 * @param data
 * @param pretty
 */
const exportJSONFile = (fileName: string, data: unknown, pretty?: boolean) => {
    pretty = pretty ?? true;
    const dataString = JSON.stringify(data, null, pretty ? 2 : 0);
    const blob = new Blob([dataString], { type: "application/json" });
    const blobURL = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobURL;
    link.download = `${encodeURIComponent(fileName)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export { exportJSONFile };
