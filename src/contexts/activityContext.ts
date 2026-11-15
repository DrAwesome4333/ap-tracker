import { createContext } from "react";

const ActivityContext: React.Context<{
    add: (activityName: string) => void; // callback to add to stack
    drop: (activityName?: string) => void; // callback to remove last item from stack. If name is provided, last activity and all following activities should be dropped
    remove: (activityName: string) => void; // callback to remove activity from stack
    stack: string[]; // immutable stack
}> = createContext({
    add: () => {
        throw new Error("Please provide add logic");
    },
    drop: () => {
        throw new Error("Please provide drop logic");
    },
    remove: () => {
        throw new Error("Please provide remove logic");
    },
    stack: [],
});

export default ActivityContext;
