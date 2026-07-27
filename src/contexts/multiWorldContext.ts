import { createContext } from "react";

enum MultiWorldConnectionMode {
    None = "none",
    WebAPI = "api",
    Server = "server",
}

type MultiWorldContextData = {
    multiSaveId?: string;
    connectionMode: MultiWorldConnectionMode;
};

const MultiWorldContext = createContext<MultiWorldContextData>({
    multiSaveId: null,
    connectionMode: MultiWorldConnectionMode.None,
});
