import { useContext, useSyncExternalStore } from "react";
import ServiceContext from "../contexts/serviceContext";

const useAPConnection = () => {
    const services = useContext(ServiceContext);
    const connector = services.connector;
    // const status = useSyncExternalStore(
    //     connector.connection.subscribe,
    //     () => connector.connection,
    //     () => connector.connection,
    // )
    return null; //status;
};

export default useAPConnection;
