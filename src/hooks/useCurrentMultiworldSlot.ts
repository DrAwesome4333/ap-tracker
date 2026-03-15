import { useSyncExternalStore } from "react";
import MultiWorldContext from "../services/MultiInfo/MultiWorldContext";

const useCurrentMultiworldSlot = () => {
    const slot = useSyncExternalStore(
        MultiWorldContext.addUpdateCallback,
        () => MultiWorldContext.loadedSlot,
        () => MultiWorldContext.loadedSlot
    );
    return slot;
};

export default useCurrentMultiworldSlot;
