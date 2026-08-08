import React, { use, useContext, useState } from "react";
import ServiceContext from "../../contexts/serviceContext";
import CustomTrackerOptions from "./CustomTrackerOptions";
import OptionBlock from "./OptionBlock";
import StickySpacer from "../shared/StickySpacer";
import ChecklistSettings from "./ChecklistSettings";
import { baseTrackerOptions } from "../../services/options/trackerOptions";
import OptionView from "./OptionView";
import InventorySettings from "./InventorySettings";
import LayoutSettings from "./LayoutSettings";
import HintSettings from "./HintTagSettings";
import { colorOptionsDef } from "../../services/theme/ColorManager";
import {
    DangerButton,
    PrimaryButton,
    SecondaryButton,
    TextButton,
} from "../shared/buttons";
import { DB_STORE_KEYS, SaveData } from "../../services/saveData";
import MultiWorldService from "../../services/MultiInfo/MultiWorldService";
import NotificationManager, {
    MessageType,
} from "../../services/notifications/notifications";
import { LocalStorageDataStore } from "../../services/dataStores";
import Icon from "../icons/icons";
import { copyToClipboard } from "../../utility/clipboard";
import { randomUUID } from "../../utility/uuid";
import { Input } from "../inputs";
const clientUuidStore = new LocalStorageDataStore("ap-checklist-client-uuid");
const OptionsScreen = () => {
    const serviceContext = useContext(ServiceContext);
    const [packageWorkInProgress, setPackageWorkInProgress] = useState(false);
    const [showClientId, setShowClientId] = useState(false);
    const [editorClientId, setEditorClientId] = useState("");
    const [clientId, setClientId] = useState<string>(
        clientUuidStore.read("uuid") as string
    );
    const optionManager = serviceContext.optionManager;
    if (!optionManager) {
        throw new Error(
            "No option manager provided for option screen, you should be worried"
        );
    }
    const trackerManager = serviceContext.trackerManager;
    if (!trackerManager) {
        console.warn("No tracker manager provided");
    }
    const customTrackerRepository = serviceContext.customTrackerRepository;
    if (!customTrackerRepository) {
        console.warn("No custom tracker repository added");
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
            }}
        >
            <OptionBlock title="Theme Settings">
                <OptionView option={baseTrackerOptions["Theme:base"]} />
            </OptionBlock>
            <OptionBlock title="Tracker Layout">
                <LayoutSettings />
            </OptionBlock>
            <OptionBlock title="Checklist Settings">
                <ChecklistSettings optionManager={optionManager} />
            </OptionBlock>
            <OptionBlock title="Inventory Settings">
                <InventorySettings />
            </OptionBlock>
            <OptionBlock title="Custom Tracker Manager">
                {customTrackerRepository ? (
                    <CustomTrackerOptions
                        customTrackerRepository={customTrackerRepository}
                    />
                ) : (
                    <i>Failed to initiate tracker manager</i>
                )}
            </OptionBlock>
            <OptionBlock title="Hint Tag Settings">
                <HintSettings hideTitle />
            </OptionBlock>
            <OptionBlock title="Color Settings">
                <p>Note: colors are muted in light mode</p>
                <OptionView option={colorOptionsDef} />
                <SecondaryButton
                    style={{ marginTop: "1rem" }}
                    onClick={() => {
                        optionManager.setOptionValue(
                            "APColors",
                            "global",
                            null
                        );
                    }}
                >
                    Reset Colors
                </SecondaryButton>
            </OptionBlock>

            <OptionBlock title={"Data Package Cache"}>
                <p>
                    Use these to clean up the data package cache to free up
                    memory.
                </p>
                <p>
                    Only use the Clear All option if you are running into
                    item/location name related errors.
                </p>
                <PrimaryButton
                    onClick={async () => {
                        setPackageWorkInProgress(true);
                        const statusHandle = NotificationManager.createStatus({
                            message: "Clearing Data Package cache",
                            type: MessageType.progress,
                            progress: -1,
                        });
                        const usedChecksums: Set<string> = new Set();
                        const multiWorlds =
                            MultiWorldService.getAllMultiWorldsWithSlots();
                        multiWorlds.forEach((multiWorld) => {
                            if (multiWorld.data_package_details) {
                                Object.values(
                                    multiWorld.data_package_details
                                ).forEach((checksum) =>
                                    usedChecksums.add(checksum)
                                );
                            }
                        });
                        try {
                            const allPackageKeys = (await SaveData.getAllKeys(
                                DB_STORE_KEYS.dataPackageCache
                            )) as [string, string][];
                            const packagesToRemove = allPackageKeys.filter(
                                ([_game, checksum]) =>
                                    !usedChecksums.has(checksum)
                            );
                            const promises = packagesToRemove.map((key) =>
                                SaveData.deleteItem(
                                    DB_STORE_KEYS.dataPackageCache,
                                    key
                                )
                            );
                            await Promise.all(promises);
                            statusHandle.update({
                                message: `Cleared ${packagesToRemove.length} data package${packagesToRemove.length === 1 ? "" : "s"}.`,
                                progress: 1,
                                duration: 3,
                                type: MessageType.success,
                            });
                        } catch (e) {
                            statusHandle.update({
                                message: "Failed to clear data package cache",
                                type: MessageType.error,
                                progress: 0,
                                duration: 3,
                            });
                            NotificationManager.createToast({
                                message:
                                    "Failed to clear data packages from cache",
                                details: `Failed to clear all unused data packages. Please try again. \n\nError: \n${e.message}`,
                                type: MessageType.error,
                            });
                        }
                        setPackageWorkInProgress(false);
                    }}
                    disabled={packageWorkInProgress}
                >
                    Clear unused
                </PrimaryButton>
                <DangerButton
                    onClick={async () => {
                        setPackageWorkInProgress(true);
                        const statusHandle = NotificationManager.createStatus({
                            message: "Clearing Data Package cache",
                            type: MessageType.progress,
                            progress: -1,
                        });

                        try {
                            const allPackageKeys = (await SaveData.getAllKeys(
                                DB_STORE_KEYS.dataPackageCache
                            )) as [string, string][];
                            const packagesToRemove = allPackageKeys;
                            const promises = packagesToRemove.map((key) =>
                                SaveData.deleteItem(
                                    DB_STORE_KEYS.dataPackageCache,
                                    key
                                )
                            );
                            await Promise.all(promises);
                            statusHandle.update({
                                message: `Cleared ${packagesToRemove.length} data package${packagesToRemove.length === 1 ? "" : "s"}.`,
                                progress: 1,
                                duration: 3,
                                type: MessageType.success,
                            });
                        } catch (e) {
                            statusHandle.update({
                                message: "Failed to clear data package cache",
                                type: MessageType.error,
                                progress: 0,
                                duration: 3,
                            });
                            NotificationManager.createToast({
                                message:
                                    "Failed to clear data packages from cache",
                                details: `Failed to clear all data packages. Please try again. \n\nError: \n${e.message}`,
                                type: MessageType.error,
                            });
                        }
                        setPackageWorkInProgress(false);
                    }}
                    disabled={packageWorkInProgress}
                >
                    Clear All
                </DangerButton>
            </OptionBlock>

            <OptionBlock title="Identity">
                <p>
                    Archipelago servers request an identifier for every
                    connection.
                </p>
                <p>
                    Enabling the static id option will make your identifier
                    static, allowing for the multi-world server to recognize you
                    again if you reconnect.
                </p>
                <p>
                    Treat this as you would a password. You can share it with
                    your other devices if desired.
                </p>
                <OptionView
                    option={baseTrackerOptions["Connection:StaticUUID"]}
                />
                <div>
                    <PrimaryButton
                        small
                        onClick={() => setShowClientId((old) => !old)}
                    >
                        {showClientId ? "Hide Identifier" : "Show Identifier"}
                    </PrimaryButton>
                    {showClientId && (
                        <p>
                            Id:{" "}
                            <TextButton
                                onClick={() => copyToClipboard(clientId)}
                            >
                                {clientId} <Icon type="content_copy" />
                            </TextButton>
                        </p>
                    )}
                </div>
                <div>
                    <Input
                        type="text"
                        value={editorClientId}
                        onChange={(e) => setEditorClientId(e.target.value)}
                        label="New Identifier"
                        maxLength={50}
                    />
                    <SecondaryButton
                        small
                        disabled={!editorClientId}
                        onClick={() => {
                            const newId = editorClientId;
                            setClientId(newId);
                            clientUuidStore.write(newId, "uuid");
                        }}
                    >
                        Use Identifier
                    </SecondaryButton>
                </div>
                <DangerButton
                    small
                    onClick={() => {
                        const newId = randomUUID();
                        setClientId(newId);
                        clientUuidStore.write(newId, "uuid");
                    }}
                >
                    Generate New Identifier
                </DangerButton>
            </OptionBlock>

            <OptionBlock title="Attributions">
                <img
                    src="./icon.svg"
                    width={"64px"}
                    style={{ float: "left", marginRight: "1em" }}
                />
                The Archipelago Logos used by this app are the modified works of
                Krista Corkos and Christopher Wilson (© 2022) and is licensed
                under Attribution-NonCommercial 4.0 International. To view a
                copy of this license, visit{" "}
                <a
                    href="http://creativecommons.org/licenses/by-nc/4.0/"
                    target="_blank"
                    rel="noreferrer"
                >
                    http://creativecommons.org/licenses/by-nc/4.0/
                </a>
                <br />
                <br />
                This app is primarily built using{" "}
                <a href="https://react.dev/" target="_blank" rel="noreferrer">
                    React
                </a>{" "}
                and{" "}
                <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
                    NextJS
                </a>{" "}
                with{" "}
                <a
                    href="https://github.com/ThePhar/archipelago.js"
                    target="_blank"
                    rel="noreferrer"
                >
                    Archipelago.js
                </a>{" "}
                to connect to Archipelago. <br />
                More information about other libraries used and their licenses
                can be found on this project&apos;s{" "}
                <a
                    href="https://github.com/DrAwesome4333/ap-tracker"
                    target="_blank"
                    rel="noreferrer"
                >
                    GitHub repository
                </a>
                . Please report any problems you find there.
            </OptionBlock>
            <div
                style={{
                    textAlign: "center",
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "1em",
                }}
            >
                Version: {process.env.NEXT_PUBLIC_APP_VERSION}
                {process.env.NEXT_PUBLIC_ENVIRONMENT_NAME
                    ? `-${process.env.NEXT_PUBLIC_ENVIRONMENT_NAME}`
                    : ""}
            </div>
            <StickySpacer />
        </div>
    );
};

export default OptionsScreen;
