import { useEffect, useState } from "react";
import HintManager from "../services/HintManager";
import { Hint } from "archipelago.js";

const useHints = (hintManager?: HintManager) => {
    const [hints, setHints] = useState<Hint[]>([]);
    useEffect(() => {
        const callback = () => {
            setHints(hintManager?.hints ?? []);
        };
        callback();
        const cleanup = hintManager?.addHintListener(callback);
        return () => {
            cleanup?.();
        };
    }, [hintManager]);
    return hints;
};

export { useHints };
