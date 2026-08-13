import { createContext } from "react";

const ActivityContext: React.Context<{
    add: (activityName: string) => void; // callback to add to stack
    drop: (activityName?: string) => void; // callback to remove last item from stack. If name is provided, last activity and all following activities should be dropped
    stack: string[]; // imutable stack
}> = createContext({
    add: () => {
        throw new Error("Please provide add logic");
    },
    drop: () => {
        throw new Error("Please provide drop logic");
    },
    stack: [],
});

export default ActivityContext;
