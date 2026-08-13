const canCopy = () => {
    return !!window.navigator.clipboard;
};

const copyToClipboard = (text: string) => {
    if (canCopy()) {
        try {
            window.navigator.clipboard.writeText(text);
        } catch (e) {
            console.error(e);
        }
    }
};

export { canCopy, copyToClipboard };
