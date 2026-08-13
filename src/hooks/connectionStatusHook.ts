import { useContext, useEffect, useState } from "react";
import { ConnectionStatus } from "../services/connector/APConnector";
import ServiceContext from "../contexts/serviceContext";

const useAPConnectionStatus = () => {
    const [apStatus, setApStatus] = useState({
        status: ConnectionStatus.disconnected,
        disconnected: true,
        connected: false,
        connecting: false,
    });
    const serviceContext = useContext(ServiceContext);
    const connector = serviceContext.connector;
    useEffect(() => {
        let cleanupCallback = () => {};
        if (connector) {
            cleanupCallback = connector.statusUpdateHook(() => {
                const status = {
                    status: connector.status,
                    disconnected: false,
                    connected: false,
                    connecting: false,
                };
                switch (connector.status) {
                    case ConnectionStatus.connected:
                        status.connected = true;
                        break;
                    case ConnectionStatus.connecting:
                        status.connecting = true;
                        break;
                    case ConnectionStatus.disconnected: // fall through
                    default:
                        status.disconnected = true;
                        break;
                }
                setApStatus(status);
            });
        }
        return cleanupCallback;
    }, [connector]);
    return apStatus;
};

export { useAPConnectionStatus };
