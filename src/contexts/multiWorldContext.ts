import { createContext } from "react";
import { MultiWorldContextData } from "../services/MultiInfo/MultiWorldContextData";

enum MultiWorldConnectionMode {
    None = "none",
    WebAPI = "api",
    Server = "server",
}

const MultiWorldContext = createContext<
    MultiWorldContextData & { connectionMode: MultiWorldConnectionMode }
>({
    multiSaveId: null,
    players: {},
    groups: {},
    trackedSlots: [],
    gamePackages: null,
    connectionMode: MultiWorldConnectionMode.None,
});

export default MultiWorldContext;

export { MultiWorldConnectionMode };
