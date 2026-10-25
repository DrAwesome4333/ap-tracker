import { useContext, useEffect, useState } from "react";
import ServiceContext from "../contexts/serviceContext";

const useHintPoints = () => {
    const services = useContext(ServiceContext);
    const [hintPoints, setHintPoints] = useState<number>(0);

    useEffect(() => {
        if (services.connector) {
            setHintPoints(services.connector.hintPoints());
            return services.connector.hintPointUpdateHook((points) =>
                setHintPoints(points)
            );
        } else {
            setHintPoints(0);
        }
    }, [services.connector]);

    return hintPoints;
};

export default useHintPoints;
