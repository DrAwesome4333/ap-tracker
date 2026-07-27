import { useSyncExternalStore } from "react";
import MultiWorldService from "../services/MultiInfo/MultiWorldService";

const useCurrentMultiworldSlot = () => {
    const slot = useSyncExternalStore(
        MultiWorldService.addUpdateCallback,
        () => MultiWorldService.loadedSlot,
        () => MultiWorldService.loadedSlot
    );
    return slot;
};

export default useCurrentMultiworldSlot;
