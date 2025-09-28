const emptySyncCallback = (_: () => void) => {
    /* There is nothing to listen to*/ return () => {
        /* Empty clean up call */
    };
};

export default emptySyncCallback;
