// @ts-check

/** Data that can be used to create a new Saved Connection
 * @typedef SavedConnectionInfo
 * @prop {string} seed
 * @prop {string} host
 * @prop {string} port
 * @prop {string} slot
 * @prop {string} game
 * @prop {string} [password]
 * @prop {string} [playerAlias]
 */

/**
 * @typedef SavedConnection
 * @prop {string} connectionId A unique identifier for the connection
 * @prop {string} name
 * @prop {string} seed
 * @prop {string} host
 * @prop {string} port
 * @prop {string} slot
 * @prop {string} game
 * @prop {string} [password]
 * @prop {string} [playerAlias]
 * @prop {number} lastUsedTime
 * @prop {number} createdTime
 * @prop {number} version
 * @prop {*} settings
 * @prop {*} saveData
 */

/** @type {Set<()=>void>} */
const connectionListeners = new Set();
/**
 * Returns a function that can be called to subscribe to saved connection updates
 * @returns
 */
const getSubscriberCallback = () => {
    return (/** @type {()=>void} */ listener) => {
        connectionListeners.add(listener);
        // return a function to clean up the subscription
        return () => {
            connectionListeners.delete(listener);
        };
    };
};

const SAVED_CONNECTION_VERSION = 2;
const CONNECTION_ITEM_NAME = "archipelagoTrackerSavedConnections";

/** @type {{connections:Object.<string, SavedConnection>, version:number, modified:number} | null}*/
let cachedConnectionData = null;

const loadSavedConnectionData = () => {
    let connectionDataString = localStorage.getItem(CONNECTION_ITEM_NAME);
    /**
     * @type {{connections:Object.<string, SavedConnection>, version:number, modified:number}}
     */
    let connectionData = connectionDataString
        ? JSON.parse(connectionDataString)
        : {
              connections: {},
              version: SAVED_CONNECTION_VERSION,
              modified: Date.now(),
          };

    let connectionIds = Object.getOwnPropertyNames(connectionData.connections);
    for (const id of connectionIds) {
        const connection = connectionData.connections[id];

        // Load and convert from ap-oot tracker

        connectionData.connections[id] = {
            ...connectionData.connections[id],
            connectionId:
                connection.connectionId ??
                connection["id"] ??
                new Date().getTime(),
            createdTime:
                connection.createdTime ??
                connection["lastConnectionTime"] ??
                new Date().getTime(),
            lastUsedTime:
                connection.lastUsedTime ??
                connection["lastConnectionTime"] ??
                new Date().getTime(),
            version: SAVED_CONNECTION_VERSION,
        };
    }
    connectionData.version = 2;
    // React requires the same object to be returned if nothing has changed
    if (
        cachedConnectionData &&
        cachedConnectionData.modified === connectionData.modified
    ) {
        return cachedConnectionData;
    }
    cachedConnectionData = connectionData;
    return connectionData;
};
/**
 *
 * @param {{connections:Object.<string, SavedConnection>, version:number, modified:number}} saveData
 */
const save = (saveData) => {
    saveData.modified = Date.now();
    localStorage.setItem(CONNECTION_ITEM_NAME, JSON.stringify(saveData));
    connectionListeners.forEach((listener) => listener());
};

/**
 *
 * @param {SavedConnection} data
 */
const saveConnectionData = (data) => {
    let currentSaveData = loadSavedConnectionData();
    if (!data.connectionId) {
        data.connectionId = `${data.seed}-${data.slot}-${new Date().getTime()}`;
        console.warn(
            `Data with no connection id was trying to be saved, added id of ${data.connectionId}`
        );
    }
    currentSaveData.connections[data.connectionId] = data;
    save(currentSaveData);
};

/**
 *
 * @param {SavedConnectionInfo} data
 * @returns {SavedConnection}
 */
const createNewSavedConnection = (data) => {
    const connectionId = `${data.seed}-${data.slot}-${new Date().getTime()}`;
    return {
        connectionId,
        seed: data.seed,
        game: data.game,
        name: `${data.playerAlias || data.slot}`,
        host: data.host,
        port: data.port,
        slot: data.slot,
        password: data.password,
        playerAlias: data.playerAlias,
        lastUsedTime: Date.now(),
        createdTime: Date.now(),
        version: SAVED_CONNECTION_VERSION,
        settings: {},
        saveData: {},
    };
};

/**
 * @param {SavedConnectionInfo} data
 */
const getExistingConnections = (data) => {
    const currentSaveData = loadSavedConnectionData();
    /** @type {Set<SavedConnection>} */
    const existingConnections = new Set();
    let connectionIds = Object.getOwnPropertyNames(currentSaveData.connections);

    for (const id of connectionIds) {
        const connection = currentSaveData.connections[id];
        if (
            connection.seed === data.seed &&
            connection.slot.toString() === data.slot.toString()
        ) {
            existingConnections.add(connection);
        }
    }
    return existingConnections;
};

/**
 * Gets information that can be passed to the connector to connect to archipelago out of a SavedConnection
 * @param {SavedConnection} data
 * @returns {{ host:string, port:string, slot:string, game:string, password:string }}
 */
const getConnectionInfo = (data) => {
    return {
        host: data.host,
        port: data.port.toString(),
        slot: data.slot,
        game: data.game,
        password: data.password ?? "",
    };
};

/**
 *
 * @param {string} id
 */
const deleteConnection = (id) => {
    const currentSaveData = loadSavedConnectionData();
    delete currentSaveData.connections[id];
    save(currentSaveData);
};

/**
 *
 * @param {string} id Id of the connection
 * @returns
 */
const getConnectionSaveData = (id) => {
    const currentSaveData = loadSavedConnectionData();
    return currentSaveData.connections[id]?.saveData;
};

/**
 *
 * @param {string} id Id of the connection
 * @returns
 */
const updateConnectionSaveData = (id, newSaveData) => {
    const currentSaveData = loadSavedConnectionData();
    currentSaveData.connections[id].saveData = newSaveData;
    save(currentSaveData);
};

const SavedConnectionManager = {
    createNewSavedConnection,
    saveConnectionData,
    getExistingConnections,
    getConnectionInfo,
    loadSavedConnectionData,
    deleteConnection,
    getSubscriberCallback,
    getConnectionSaveData,
    updateConnectionSaveData,
};

export default SavedConnectionManager;
