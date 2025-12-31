import React, { useRef, useEffect, useState, useCallback } from "react";
import { PrimaryButton, GhostButton, SecondaryButton } from "../shared/buttons";
import styles from "./NotePad.module.css";
import { saveNote, loadNote } from "../../services/connector/remoteSync";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import Spinner from "../icons/spinner";
import Modal from "../shared/Modal";

const MAX_NOTE_LENGTH = 1024;

const NotePad = ({
    open,
    onClose,
    disabled,
}: {
    open: boolean;
    onClose: () => void;
    disabled: boolean;
}) => {
    const textArea = useRef(null);
    const [noteContent, setNoteContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [initialLoad, setInitialLoad] = useState(false);

    const retrieveNote = useCallback(() => {
        if (unsavedChanges) {
            const confirmation = window.confirm(
                "You have changes that will be overwritten, are you sure?"
            );
            if (!confirmation) {
                return;
            }
        }
        setLoading(true);
        const noteStatusHandle = NotificationManager.createStatus({
            message: "Syncing Notes",
            type: MessageType.info,
            id: "note-status",
        });
        loadNote()
            .then((value) => {
                setNoteContent(value);
                setLoading(false);
                setUnsavedChanges(false);
                noteStatusHandle.update({
                    message: "Note Loaded",
                    type: MessageType.success,
                    duration: 4,
                    progress: 1,
                });
            })
            .catch((e) => {
                setLoading(false);
                noteStatusHandle.update({
                    message: "Failed to load notes",
                    type: MessageType.error,
                    duration: 4,
                    progress: 0,
                });
                NotificationManager.createToast({
                    message: "Failed to load note",
                    details: `Failed to load note due to an unexpected error.\nError:\n\t${e}`,
                    type: MessageType.error,
                });
            });
    }, [unsavedChanges]);

    const storeNote = useCallback(() => {
        if (!loading && noteContent.length <= MAX_NOTE_LENGTH) {
            const statusHandle = NotificationManager.createStatus({
                message: "Uploading note...",
                type: MessageType.progress,
            });
            setLoading(true);
            saveNote(noteContent)
                .then(() => {
                    setLoading(false);
                    setUnsavedChanges(false);
                    statusHandle.update({
                        message: "Note Saved",
                        type: MessageType.success,
                        duration: 4,
                        progress: 1,
                    });
                })
                .catch((e) => {
                    setLoading(false);
                    statusHandle.update({
                        message: "Failed to save note",
                        type: MessageType.error,
                        duration: 4,
                        progress: 0,
                    });
                    NotificationManager.createToast({
                        message: "Failed to save note",
                        details: `Failed to save note due to an unexpected error.\nError:\n\t${e}`,
                        type: MessageType.error,
                    });
                });
        }
    }, [loading, noteContent]);

    useEffect(() => {
        if (noteContent === "" && !disabled && !loading && !initialLoad) {
            setInitialLoad(true);
            retrieveNote();
        }
    }, [disabled, noteContent, retrieveNote, loading, initialLoad]);
    return (
        <Modal open={open}>
            <div className={styles.note_grid}>
                <div style={{ gridArea: "title" }}>
                    <div className={styles.note_header}>
                        <h3>AP Notepad (experimental)</h3>
                        <span>
                            {loading ? (
                                <Spinner />
                            ) : unsavedChanges ? (
                                " Not saved"
                            ) : (
                                ""
                            )}
                        </span>
                    </div>
                    <span>
                        Save notes in server storage. This note can be seen and
                        modified by anyone with access to the Archipelago
                        server.
                    </span>
                </div>

                <textarea
                    className={styles.note_text_area}
                    disabled={disabled || loading}
                    value={noteContent}
                    ref={textArea}
                    onKeyDown={(e) => {
                        if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();
                            const start = textArea.current?.selectionStart;
                            const end = textArea.current?.selectionEnd;
                            const value = textArea.current?.value;
                            if (textArea.current) {
                                textArea.current.value =
                                    value.substring(0, start) +
                                    "\t" +
                                    value.substring(end);
                                textArea.current.selectionStart = start + 1;
                                textArea.current.selectionEnd = end + 1;
                                setNoteContent(textArea.current.value);
                            }
                        }
                    }}
                    onChange={(e) => {
                        setUnsavedChanges(true);
                        setNoteContent(e.target.value);
                    }}
                />
                <div className={styles.note_footer}>
                    <div
                        style={{
                            color:
                                noteContent.length > MAX_NOTE_LENGTH
                                    ? "var(--danger-accent)"
                                    : "var(--text-primary)",
                        }}
                    >
                        {noteContent.length} / {MAX_NOTE_LENGTH}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "right",
                        }}
                    >
                        <PrimaryButton
                            small
                            onClick={storeNote}
                            disabled={
                                disabled ||
                                loading ||
                                noteContent.length > MAX_NOTE_LENGTH
                            }
                        >
                            Save to Server
                        </PrimaryButton>
                        <SecondaryButton
                            small
                            onClick={retrieveNote}
                            disabled={disabled || loading}
                        >
                            Load from Server
                        </SecondaryButton>
                        <GhostButton small onClick={onClose}>
                            Close
                        </GhostButton>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default NotePad;
