// @ts-check
import React, { useState } from "react";
import NewConnection from "../connectionComponents/NewConnection";
import SavedConnections from "../connectionComponents/SavedConnections";
import Modal from "../shared/Modal";
import styles from "./StartScreen.module.css";
import { PrimaryButton } from "../shared/buttons";
import ButtonRow from "../LayoutUtilities/ButtonRow";

const StartScreen = () => {
    const [newModalOpen, setNewModalOpen] = useState(false);

    return (
        <div className={styles.start_screen}>
            <SavedConnections />
            <ButtonRow>
                <PrimaryButton
                    style={{ fontWeight: "bold" }}
                    onClick={() => setNewModalOpen(true)}
                >
                    Add Slot
                </PrimaryButton>
            </ButtonRow>
            <Modal open={newModalOpen}>
                <NewConnection onClose={() => setNewModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default StartScreen;
