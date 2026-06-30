import React from "react";
import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
    title: "AP Tracker",
    description: "Checklist Tracker for Archipelago",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <title>Checklist Tracker</title>
                <link rel="icon" href="./favicon.ico" sizes="any" />
                <link rel="manifest" href="./manifest.json" />
            </head>
            <body>
                <noscript>
                    You need to enable JavaScript to run this app.
                </noscript>
                <div id="root">{children}</div>
            </body>
        </html>
    );
}
