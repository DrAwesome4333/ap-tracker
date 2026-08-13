import React from "react";
import Modal from "../shared/Modal";
import { GhostButton } from "../shared/buttons";
import ButtonRow from "../LayoutUtilities/ButtonRow";

const CustomTrackerHelpModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    return (
        <Modal
            open={open}
            header={<h3>Custom Tracker Information</h3>}
            footer={
                <ButtonRow>
                    {" "}
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            }
        >
            <div
                className="documentation"
                style={{
                    width: "90vw",
                }}
            >
                <p>
                    Custom Trackers are a way to customize your checklists to
                    your liking.
                </p>
                <p>
                    Currently the only way to create one is to use JSON files
                    that describe your checklist following a format that is
                    documented &nbsp;
                    <a
                        href="https://github.com/DrAwesome4333/ap-tracker/blob/main/docs/customTrackers.md"
                        target="_blank"
                        rel="noreferrer"
                    >
                        on this GitHub page
                    </a>
                    .
                </p>
                <p>Here are some ways to get a working template:</p>
                <h3>Location Group Templates:</h3>
                <p>
                    These templates use location groups defined by Archipelago
                    world developers to populate dropdowns. While helpful for
                    organizing locations, these groups were not intended for
                    checklists, so the quality varies by game. In some cases,
                    developers have not added location groups at all, making
                    this option no better than a simple list.
                </p>
                <p>
                    This is the same template the tracker uses by default on any
                    new games it encounters.
                </p>
                <h3>Name Analysis Templates:</h3>
                <p>
                    Templates generated using this option take a look at the
                    location names themselves and try to determine appropriate
                    grouping for those.
                </p>
                <p>
                    The algorithm first splits each location name into tokens,
                    based on the token settings below. It then groups locations
                    that share starting tokens, following the listed grouping
                    requirements.
                </p>
                <h4>Token Settings: </h4>
                <ul>
                    <li>
                        <b>Split Characters:</b> Any time the app sees a
                        character in this list, it will consider it the start of
                        a new token.
                    </li>
                    <li>
                        <b>Case Split:</b> Any time the app sees a change from
                        lowercase to uppercase, it will consider this as the
                        start of a new token.
                    </li>
                    <li>
                        <b>Character Split:</b> Selecting this option ignores
                        the other options and considers each character in the
                        name its own token.
                    </li>
                </ul>
                <h4>Grouping parameters</h4>
                <ul>
                    <li>
                        <b>Minium location count:</b> The minimum number
                        locations that must share a prefix to create a group for
                        them.
                    </li>
                    <li>
                        <b>Max dropdown depth:</b> How nested the generated
                        groups should be.
                    </li>
                    <li>
                        <b>Minimum token count:</b> Determines how many tokens
                        are must match in a name before it is split. Note that
                        split characters count as tokens.
                    </li>
                </ul>
            </div>
        </Modal>
    );
};

export default CustomTrackerHelpModal;
