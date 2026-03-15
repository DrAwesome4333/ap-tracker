import { useContext, useSyncExternalStore } from "react";
import SlotContext from "../contexts/slotContext";
import emptySyncCallback from "./emptyCallback";

const useSlotItems = () => {
    const slotContext = useContext(SlotContext);
    const itemRepository = slotContext.itemRepository;
    const items = useSyncExternalStore(
        itemRepository?.anyItemUpdateHook ?? emptySyncCallback,
        itemRepository?.getAllItems,
        itemRepository?.getAllItems
    );
    if (!itemRepository) {
        return [];
    }
    return items;
};

export { useSlotItems };
