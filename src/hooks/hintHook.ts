import { useMemo, useSyncExternalStore } from "react";
import HintManager from "../services/HintManager";
import emptySyncCallback from "./emptyCallback";

const useHints = (hintManager?: HintManager) => {
    const trigger = useMemo(() => {
        return hintManager?.getHintHook() ?? emptySyncCallback;
    }, [hintManager]);
    const snapshot = useMemo(() => {
        return () => hintManager?.hints ?? null;
    }, [hintManager]);

    return useSyncExternalStore(trigger, snapshot, snapshot);
};

export { useHints };
