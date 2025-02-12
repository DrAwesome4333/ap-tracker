// @ts-check
import { createPortal } from "react-dom";
import React, { useEffect, useState, useRef, useContext } from "react";
import NotificationManager from "../../../services/notifications/notifications";
import Toast from "./toastNotification";
import styled from "styled-components";
import { SecondaryButton } from "../../buttons";
import Dialog from "../../shared/Dialog";
import ServiceContext from "../../../contexts/serviceContext";
import useOption from "../../../hooks/optionHook";
import { readThemeValue } from "../../../services/theme/theme";

const ContentContainer = styled.div`
    width: fit-content;
    max-width: 75vw;
    display: grid;
    align-items: end;
    justify-items: center;
    row-gap: 0.25em;
    grid-template-areas:
        "message"
        "details"
        "close";
`;

let ToastContainer = () => {
    let [notifications, setNotifications] = useState([]);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailIndex, setDetailIndex] = useState(0);
    const dialog = useRef(null);
    const animationFrameRef = useRef(0);
    const timeRef = useRef(0);
    const frozenRef = useRef(false);
    const serviceContext = useContext(ServiceContext);
    const optionManger = serviceContext.optionManager;
    const themeValue = useOption(optionManger, "theme", "global");

    const openDetailModal = (index) => {
        setDetailIndex(index);
        setDetailModalOpen(true);
    };

    const pause = () => {
        frozenRef.current = true;
    };

    const resume = () => {
        frozenRef.current = false;
    };

    useEffect(() => {
        if (detailModalOpen) {
            dialog.current?.showModal();
        } else {
            dialog.current?.close();
        }
    }, [detailModalOpen]);

    useEffect(() => {
        /**
         * @param {import("../../../services/notifications/notifications").ToastNotification} toast
         */
        let addToast = (toast) => {
            let newNotifications = notifications.slice(0);
            newNotifications.unshift({
                message: toast.message,
                type: toast.type,
                id: toast.id,
                remainingTime: toast.duration,
                duration: toast.duration,
                details: toast.details,
            });
            setNotifications(newNotifications);
        };

        let update = (time) => {
            animationFrameRef.current = requestAnimationFrame(update);
            if (!timeRef.current) {
                timeRef.current = time;
                return;
            }
            let delta = time - timeRef.current;
            timeRef.current = time;
            setNotifications((n) =>
                n
                    .map((x) => ({
                        ...x,
                        remainingTime:
                            frozenRef.current || detailModalOpen
                                ? x.remainingTime
                                : x.remainingTime - delta,
                    }))
                    .filter((x) => x.remainingTime > -300)
            );
        };

        animationFrameRef.current = requestAnimationFrame(update);
        NotificationManager.addToastListener(addToast);
        return () => {
            NotificationManager.removeToastListener(addToast);
            cancelAnimationFrame(animationFrameRef.current);
        };
    });

    return (
        <>
            {createPortal(
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        display: "block",
                        margin: 0,
                        padding: 0,
                        pointerEvents: "none",
                        zIndex: 100,
                    }}
                    data-theme={readThemeValue(themeValue)}
                >
                    {detailModalOpen && notifications[detailIndex] && (
                        <Dialog ref={dialog}>
                            <ContentContainer>
                                <h3 style={{ gridArea: "message" }}>
                                    {notifications[detailIndex].message}
                                </h3>
                                <div style={{ gridArea: "details", whiteSpace:"pre-wrap" }}>
                                    {notifications[detailIndex].details}
                                </div>
                                <SecondaryButton
                                    style={{ gridArea: "close" }}
                                    // @ts-ignore
                                    $small
                                    onClick={() => {
                                        setDetailModalOpen(false);
                                    }}
                                >
                                    Close
                                </SecondaryButton>
                            </ContentContainer>
                        </Dialog>
                    )}
                    {notifications.map((toast, index) => (
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            key={toast.id}
                            index={index}
                            remainingTime={toast.remainingTime}
                            duration={toast.duration}
                            details={toast.details}
                            mouseEnter={pause}
                            mouseLeave={resume}
                            click={() => {
                                openDetailModal(index);
                            }}
                        ></Toast>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};

export default ToastContainer;
