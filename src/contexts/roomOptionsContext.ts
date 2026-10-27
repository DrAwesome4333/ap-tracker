import { createContext } from "react";
import {
    CollectMode,
    ReleaseMode,
    RemainingMode,
} from "../constants/apConstants";

type RoomOptions = {
    hintCost: number;
    hintCostPercent: number;
    locationCheckPoints: number;
    password: boolean;
    releaseMode: ReleaseMode;
    remainingMode: RemainingMode;
    collectMode: CollectMode;
};

const RoomOptionContext = createContext<RoomOptions>(null);

export default RoomOptionContext;
export type { RoomOptions };
