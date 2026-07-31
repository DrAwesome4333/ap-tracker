import { GamePackageWrapper } from "../gamepackage/GamePackageWrapper";

// Data Types
type MultiWorldPlayer = {
    name: string;
    alias?: string;
    slot: number;
    game: string;
    groups: Set<number>;
};

type MultiWorldGroup = {
    name: string;
    game: string;
    slot: number;
    players: Set<number>;
};

type MultiWorldContextData = {
    players: Record<number, MultiWorldPlayer>;
    groups: Record<number, MultiWorldGroup>;
    gamePackages?: Record<string, GamePackageWrapper>;
    multiSaveId?: string;
    trackedSlots?: number[];
    trackedSlot?: number;
};

enum SlotRelevance {
    own,
    own_group,
    tracked,
    tracked_group,
    other,
    other_group,
}

const MultiWorldContextHelper = {
    getSlotName(context: MultiWorldContextData, slotNumber: number) {
        return (
            context.players[slotNumber]?.alias ??
            context.players[slotNumber]?.name ??
            context.groups[slotNumber]?.name ??
            `Unknown Player ${slotNumber}`
        );
    },
    getSlotGame(context: MultiWorldContextData, slotNumber: number) {
        return (
            context.players[slotNumber]?.game ??
            context.groups[slotNumber]?.game ??
            null
        );
    },
    getItemName(
        context: MultiWorldContextData,
        slotNumber: number,
        itemId: number
    ) {
        return context.gamePackages[
            this.getSlotGame(context, slotNumber)
        ].getItemName(itemId);
    },
    getLocationName(
        context: MultiWorldContextData,
        slotNumber: number,
        locationId: number
    ) {
        return context.gamePackages[
            this.getSlotGame(context, slotNumber)
        ].getLocationName(locationId);
    },
    getSlotRelevance(context: MultiWorldContextData, slotNumber: number) {
        if (slotNumber === context.trackedSlot) return SlotRelevance.own;

        if (context.trackedSlots?.includes(slotNumber))
            return SlotRelevance.tracked;

        if (context.players[slotNumber]) return SlotRelevance.other;

        if (context.players[context.trackedSlot]?.groups.has(slotNumber))
            return SlotRelevance.own_group;

        if (
            context.trackedSlots?.some((trackedSlotNumber) =>
                context.players[trackedSlotNumber].groups.has(slotNumber)
            )
        )
            return SlotRelevance.tracked_group;

        return SlotRelevance.other_group;
    },
};
export { MultiWorldContextHelper, SlotRelevance };
export type { MultiWorldPlayer, MultiWorldGroup, MultiWorldContextData };
