import React, { useContext, useState, useSyncExternalStore } from "react";
import styled from "styled-components";
import { PrimaryButton, SecondaryButton } from "../buttons";
import SavedConnectionManager, {
    SavedConnection,
} from "../../services/savedConnections/savedConnectionManager";
import SavedConnectionView from "./SavedConnectionView";
import ServiceContext from "../../contexts/serviceContext";
import { TrackerStateContext } from "../../contexts/contexts";
import { CONNECTION_STATUS } from "../../services/connector/connector";
import EditConnectionDialog from "./EditConnection";
import NotificationManager from "../../services/notifications/notifications";

const Container = styled.div`
    display: grid;
    align-items: center;
    justify-items: center;
    justify-self: center;
    align-self: center;
    row-gap: 0.25em;
    width: 80%;
    margin: 1em 2em;
    grid-template-rows: 3em 1fr 3em;
    grid-template-columns: 1fr;
    max-height: 75%;
    height: fit-content;
`;

const SavedConnections = ({ ...props }) => {
    const trackerState = useContext(TrackerStateContext);
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const connectionData = useSyncExternalStore(
        SavedConnectionManager.getSubscriberCallback(),
        () => SavedConnectionManager.loadSavedConnectionData(),
        () => SavedConnectionManager.loadSavedConnectionData()
    );
    const allConnections: SavedConnection[] = [];
    const connectionIds = Object.getOwnPropertyNames(
        connectionData.connections
    );

    const serviceContext = useContext(ServiceContext);
    const connector = serviceContext.connector;
    let disabled = false;
    if (
        !connector ||
        trackerState.connectionStatus !== CONNECTION_STATUS.disconnected
    ) {
        disabled = true;
    }

    for (const key of connectionIds) {
        allConnections.push(connectionData.connections[key]);
    }
    const sortedConnections = [...allConnections];
    sortedConnections.sort((a, b) => b.lastUsedTime - a.lastUsedTime);

    const selectId = (id: string) => {
        if (id !== selectedConnection?.connectionId) {
            setSelectedConnection(connectionData.connections[id]);
        } else {
            connect();
        }
    };

    const connect = () => {
        if (selectedConnection) {
            const connectionInfo =
                SavedConnectionManager.getConnectionInfo(selectedConnection);
            connector
                .connectToAP(connectionInfo, selectedConnection.seed)
                .catch((result) => {
                    NotificationManager.createToast({
                        ...result,
                    });
                });
        }
    };

    const openEditor = () => {
        if (selectedConnection) {
            setEditorOpen(true);
        }
    };

    const closeEditor = () => {
        setEditorOpen(false);
        setSelectedConnection(null);
    };

    return (
        <Container {...props}>
            <h2>Saved Connections</h2>
            <div
                style={{
                    overflowY: "auto",
                    minHeight: "5em",
                    maxHeight: "100%",
                    width: "100%",
                }}
            >
                {sortedConnections.length > 0 ? (
                    <>
                        {sortedConnections.map((connection) => (
                            <SavedConnectionView
                                key={connection.connectionId}
                                {...connection}
                                disabled={disabled}
                                selected={
                                    connection.connectionId ===
                                    selectedConnection?.connectionId
                                }
                                onClick={selectId}
                            />
                        ))}
                    </>
                ) : (
                    <div
                        style={{
                            padding: "1em",
                            color: "gray",
                            textAlign: "center",
                        }}
                    >
                        <i>Create a new connection and it will appear here</i>
                    </div>
                )}
            </div>
            <span>
                <PrimaryButton
                    onClick={connect}
                    disabled={!selectedConnection || disabled}
                >
                    Connect
                </PrimaryButton>
                <SecondaryButton
                    onClick={openEditor}
                    disabled={!selectedConnection || disabled}
                >
                    Edit
                </SecondaryButton>
            </span>
            {
                <EditConnectionDialog
                    open={editorOpen}
                    onClose={closeEditor}
                    connection={selectedConnection}
                />
            }
        </Container>
    );
};

export default SavedConnections;
