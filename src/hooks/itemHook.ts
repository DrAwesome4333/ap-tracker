import { useContext, useEffect, useEffectEvent, useState } from "react";
import SlotContext from "../contexts/slotContext";

const useSlotItems = () => {
    const slotContext = useContext(SlotContext);
    const itemRepository = slotContext.itemRepository;
    const [items, setItems] = useState([]);

    const updateItems = useEffectEvent(() => {
        setItems(itemRepository?.getAllItems() ?? []);
    });
    useEffect(() => {
        const cleanup = itemRepository?.anyItemUpdateHook(updateItems);
        updateItems();
        return () => {
            cleanup?.();
        };
    }, [itemRepository]);
    if (!itemRepository) {
        return [];
    }
    return items;
};

export { useSlotItems };
