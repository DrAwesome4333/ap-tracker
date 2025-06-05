import React, { useContext } from "react";
import Modal from "../shared/Modal";
import { Checkbox } from "../inputs";
import ButtonRow from "../LayoutUtilities/ButtonRow";
import { GhostButton } from "../buttons";
import ServiceContext from "../../contexts/serviceContext";
import useOption from "../../hooks/optionHook";
import {
    ItemType,
    MessageFilter,
    SimpleMessageType,
} from "../../services/textClientManager";

const TextClientFilterModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const services = useContext(ServiceContext);
    const optionManager = services.optionManager;
    const messageFilter = useOption(
        optionManager,
        "TextClient:message_filter",
        "global"
    ) as MessageFilter;
    const updateAllowedMessages = (
        checked: boolean,
        feature: SimpleMessageType
    ) => {
        const newFilter: MessageFilter = {
            ...messageFilter,
        };
        const allowedTypes = new Set(messageFilter.allowedTypes);
        if (checked) {
            allowedTypes.add(feature);
        } else {
            allowedTypes.delete(feature);
        }
        newFilter.allowedTypes = [...allowedTypes];
        optionManager.setOptionValue(
            "TextClient:message_filter",
            "global",
            newFilter
        );
    };

    const updateItemSendFilter = (
        checked: boolean,
        feature: ItemType,
        who: "own" | "others"
    ) => {
        const newFilter: MessageFilter = {
            ...messageFilter,
        };
        const allowedItemSendTypes = new Set(messageFilter.itemSendFilter[who]);
        if (checked) {
            allowedItemSendTypes.add(feature);
        } else {
            allowedItemSendTypes.delete(feature);
        }
        newFilter.itemSendFilter[who] = [...allowedItemSendTypes];
        optionManager.setOptionValue(
            "TextClient:message_filter",
            "global",
            newFilter
        );
    };
    return (
        <Modal open={open}>
            <div>
                <h2>Text Client Filters</h2>
                <div>
                    <Checkbox
                        label="Show Item Sends"
                        checked={messageFilter.allowedTypes.includes("item")}
                        onChange={(event) =>
                            updateAllowedMessages(event.target.checked, "item")
                        }
                    />
                    <br />
                    <Checkbox
                        label="Show Commands"
                        checked={messageFilter.allowedTypes.includes("command")}
                        onChange={(event) =>
                            updateAllowedMessages(
                                event.target.checked,
                                "command"
                            )
                        }
                    />
                    <br />
                    <Checkbox
                        label="Show Chat"
                        checked={messageFilter.allowedTypes.includes("chat")}
                        onChange={(event) =>
                            updateAllowedMessages(event.target.checked, "chat")
                        }
                    />
                    <br />
                    <Checkbox
                        label="Show Status Updates"
                        checked={messageFilter.allowedTypes.includes("status")}
                        onChange={(event) =>
                            updateAllowedMessages(
                                event.target.checked,
                                "status"
                            )
                        }
                    />
                    <br />
                    <Checkbox
                        label="Show Log-in/Log-out"
                        checked={messageFilter.allowedTypes.includes("login")}
                        onChange={(event) =>
                            updateAllowedMessages(event.target.checked, "login")
                        }
                    />
                    <br />
                    <Checkbox
                        label="Show Miscellaneous"
                        checked={messageFilter.allowedTypes.includes("misc")}
                        onChange={(event) =>
                            updateAllowedMessages(event.target.checked, "misc")
                        }
                    />
                </div>
                <div>
                    <h4>Advanced Item Send Filters:</h4>
                    <div style={{ display: "flex", gap: "1em" }}>
                        <div style={{ width: "30%", flex: "0 1 50%" }}>
                            <p>
                                Filter items based on what you send or receive
                            </p>
                            <Checkbox
                                label="Show Own Progression"
                                disabled={
                                    !messageFilter.allowedTypes.includes("item")
                                }
                                checked={messageFilter.itemSendFilter.own.includes(
                                    "progression"
                                )}
                                onChange={(event) =>
                                    updateItemSendFilter(
                                        event.target.checked,
                                        "progression",
                                        "own"
                                    )
                                }
                            />
                            <br />
                            <Checkbox
                                label="Show Own Traps"
                                disabled={
                                    !messageFilter.allowedTypes.includes("item")
                                }
                                checked={messageFilter.itemSendFilter.own.includes(
                                    "trap"
                                )}
                                onChange={(event) =>
                                    updateItemSendFilter(
                                        event.target.checked,
                                        "trap",
                                        "own"
                                    )
                                }
                            />
                            <br />
                            <Checkbox
                                label="Show Own Useful"
                                disabled={
                                    !messageFilter.allowedTypes.includes("item")
                                }
                                checked={messageFilter.itemSendFilter.own.includes(
                                    "useful"
                                )}
                                onChange={(event) =>
                                    updateItemSendFilter(
                                        event.target.checked,
                                        "useful",
                                        "own"
                                    )
                                }
                            />
                            <br />
                            <Checkbox
                                label="Show Own Normal"
                                disabled={
                                    !messageFilter.allowedTypes.includes("item")
                                }
                                checked={messageFilter.itemSendFilter.own.includes(
                                    "normal"
                                )}
                                onChange={(event) =>
                                    updateItemSendFilter(
                                        event.target.checked,
                                        "normal",
                                        "own"
                                    )
                                }
                            />
                        </div>
                        <div style={{ width: "30%", flex: "0 1 50%" }}>
                            <p>
                                Filter items based on what others send or
                                receive
                            </p>
                            <Checkbox
                                label="Show Other's Progression"
                                disabled={
                                    !messageFilter.allowedTypes.includes("item")
                                }
                                checked={messageFilter.itemSendFilter.others.includes(
                                    "progression"
                                )}
                                onChange={(event) =>
                                    updateItemSendFilter(
                                        event.target.checked,
                                        "progression",
                                        "others"
                                    )
                                }
                            />
                            <br />
                            <Checkbox
                                label="Show Other's Traps"
                                disabled={
                                    !messageFilter.allowedTypes.includes("item")
                                }
                                checked={messageFilter.itemSendFilter.others.includes(
                                    "trap"
                                )}
                                onChange={(event) =>
                                    updateItemSendFilter(
                                        event.target.checked,
                                        "trap",
                                        "others"
                                    )
                                }
                            />
                            <br />
                            <Checkbox
                                label="Show Other's Useful"
                                disabled={
                                    !messageFilter.allowedTypes.includes("item")
                                }
                                checked={messageFilter.itemSendFilter.others.includes(
                                    "useful"
                                )}
                                onChange={(event) =>
                                    updateItemSendFilter(
                                        event.target.checked,
                                        "useful",
                                        "others"
                                    )
                                }
                            />
                            <br />
                            <Checkbox
                                label="Show Other's Normal"
                                disabled={
                                    !messageFilter.allowedTypes.includes("item")
                                }
                                checked={messageFilter.itemSendFilter.others.includes(
                                    "normal"
                                )}
                                onChange={(event) =>
                                    updateItemSendFilter(
                                        event.target.checked,
                                        "normal",
                                        "others"
                                    )
                                }
                            />
                        </div>
                    </div>

                    <br />
                </div>

                <ButtonRow>
                    <GhostButton onClick={onClose}>Close</GhostButton>
                </ButtonRow>
            </div>
        </Modal>
    );
};

export default TextClientFilterModal;
