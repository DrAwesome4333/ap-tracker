import { useCallback, useContext, useState } from "react";
import ActivityContext from "../contexts/activityContext";

const useActivityContext = () => {
    const [stack, setStack] = useState([]);
    const add = useCallback((activityName: string) => {
        setStack((old) => [...old, activityName]);
        //console.info("New Activity", activityName);
    }, []);
    const drop = useCallback((activityName?: string) => {
        if (!activityName) {
            setStack((old) => old.slice(0, -1));
        } else {
            setStack((old) => {
                const index = old.lastIndexOf(activityName);
                return old.slice(0, index);
            });
        }
        //console.info("Drop Activity", activityName ?? "(drop)");
    }, []);
    //console.log("Stack", stack)
    return { add, drop, stack };
};

const useCurrentActivity = () => {
    const activityContext = useContext(ActivityContext);
    const currentActivity =
        activityContext.stack.length > 0
            ? activityContext.stack[activityContext.stack.length - 1]
            : null;
    return currentActivity;
};

export { useActivityContext, useCurrentActivity };
