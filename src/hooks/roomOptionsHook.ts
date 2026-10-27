import { useContext, useEffect, useState } from "react";
import ServiceContext from "../contexts/serviceContext";
import { RoomOptions } from "../contexts/roomOptionsContext";

const useRoomOptions = () => {
    const services = useContext(ServiceContext);
    const [options, setOptions] = useState<RoomOptions>(null);

    useEffect(() => {
        if (services.connector) {
            setOptions(services.connector.roomOptions());
            return services.connector.roomOptionUpdateHook((newOptions) =>
                setOptions(newOptions)
            );
        } else {
            setOptions(null);
        }
    }, [services.connector]);

    return options;
};

export default useRoomOptions;
