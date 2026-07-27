// This file must be left as a .js file for the GitHub workflow to properly update it
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
/** @import { NextConfig } from 'next' */
/** @type {NextConfig} */
const nextConfig = {
    output: "export", // Outputs a Single-Page Application (SPA)
    distDir: "build", // Changes the build output directory to `build`
    assetPrefix: "./", //comment out for local server builds to work with hot reload
    experimental: {
        lightningCssFeatures: false, // broke all colors...
    },
};

export default (phase) => {
    if (phase === PHASE_DEVELOPMENT_SERVER) {
        nextConfig.assetPrefix = undefined;
    }

    return {
        ...nextConfig,
    };
};
