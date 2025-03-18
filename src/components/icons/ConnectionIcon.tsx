"use client";
import React, { useRef, useEffect, useState } from "react";
import { CONNECTION_STATUS } from "../../services/connector/connector";

const baseColors = [
    "rgb(201,118,130)",
    "rgb(117,194,117)",
    "rgb(202,148,194)",
    "rgb(217,160,125)",
    "rgb(118,126,189)",
    "rgb(238,227,145)",
];

const disconnectedColors = [
    "rgb(120,120,120)",
    "rgb(120,120,120)",
    "rgb(120,120,120)",
    "rgb(120,120,120)",
    "rgb(120,120,120)",
    "rgb(120,120,120)",
];

const errorColors = [
    "rgb(201,118,130)",
    "rgb(201,118,130)",
    "rgb(201,118,130)",
    "rgb(201,118,130)",
    "rgb(201,118,130)",
    "rgb(201,118,130)",
];

const commonStyle: React.CSSProperties = {
    stroke: "none",
    strokeWidth: 1,
    strokeDasharray: "none",
    strokeLinecap: "butt",
    strokeDashoffset: 0,
    strokeLinejoin: "miter",
    strokeMiterlimit: 4,
    fillRule: "nonzero",
    opacity: 1,
    transition: "ease-in-out fill 0.15s, ease-in-out opacity 0.25s",
};

const ConnectionIcon = ({ status }: { status: string }) => {
    const colors =
        status === CONNECTION_STATUS.connecting ||
        status === CONNECTION_STATUS.connected
            ? baseColors
            : status === CONNECTION_STATUS.disconnected
            ? disconnectedColors
            : errorColors;
    const frameRef = useRef(null);
    const timeRef = useRef(null);
    const [time, setTime] = useState(0);
    useEffect(() => {
        const update = (time: number) => {
            if (!timeRef.current) {
                timeRef.current = time;
                return;
            }
            const delta = time - timeRef.current;
            timeRef.current = time;
            setTime((t) => t + delta);
            frameRef.current = requestAnimationFrame(update);
        };
        frameRef.current = requestAnimationFrame(update);
        return () => {
            cancelAnimationFrame(frameRef.current);
        };
    });

    const colorIndex = Math.floor(time / 250);
    const getColor = (index: number) =>
        status === CONNECTION_STATUS.connecting
            ? (colorIndex - index + 6) % 6
            : index;
    return (
        <svg version="1.1" viewBox="0 0 1080 1080">
            <g transform="matrix(0.5 0 0 0.5 537.81 219.04)">
                <path
                    style={{ ...commonStyle, fill: colors[getColor(0)] }}
                    vectorEffect="non-scaling-stroke"
                    transform=" translate(-1016.3, -419.75)"
                    d="M 943.7 755.54 C 943.7 778.98 942.19 802.43 939.1600000000001 825.12 C 964.1200000000001 829.66 989.83 832.3 1016.3000000000001 832.3 C 1042.77 832.3 1068.48 829.65 1093.44 825.12 C 1090.42 802.43 1088.9 778.99 1088.9 755.54 C 1088.9 541.14 1217.8500000000001 356.22999999999996 1402.38 274.54999999999995 C 1343.76 118.38 1192.89 7.21 1016.3 7.21 C 839.7099999999998 7.21 688.83 118.38 630.22 274.55 C 814.75 356.23 943.7 541.14 943.7 755.54 z"
                    strokeLinecap="round"
                />
            </g>
            <g transform="matrix(0.5 0 0 0.5 837.09 334.18)">
                <path
                    style={{ ...commonStyle, fill: colors[getColor(1)] }}
                    vectorEffect="non-scaling-stroke"
                    transform=" translate(-1614.88, -650.03)"
                    d="M 1202.34 755.54 C 1202.34 766.13 1202.72 777.0899999999999 1203.85 787.3 C 1204.98 807.3399999999999 1208.01 827 1212.1699999999998 845.91 C 1216.33 864.8199999999999 1221.9999999999998 882.97 1228.81 900.74 C 1235.99 920.4 1244.69 938.9300000000001 1254.8999999999999 957.08 C 1349.06 868.59 1475.7299999999998 814.1500000000001 1614.8899999999999 814.1500000000001 C 1754.05 814.1500000000001 1880.7199999999998 868.6000000000001 1974.87 957.0800000000002 C 2008.52 897.3300000000002 2027.4299999999998 828.5100000000002 2027.4299999999998 755.5300000000002 C 2027.4299999999998 528.2700000000002 1842.5199999999998 342.9800000000002 1614.8799999999999 342.9800000000002 C 1588.4099999999999 342.9800000000002 1562.6999999999998 345.63000000000017 1537.7399999999998 350.1600000000002 C 1518.8299999999997 353.94000000000017 1500.2999999999997 358.4800000000002 1482.5299999999997 364.9100000000002 C 1463.6199999999997 370.9600000000002 1445.4699999999998 378.9000000000002 1427.6999999999998 388.3500000000002 C 1294.23 456.43 1202.34 595.59 1202.34 755.54 z"
                    strokeLinecap="round"
                />
            </g>
            <g transform="matrix(0.5 0 0 0.5 238.52 334.19)">
                <path
                    style={{ ...commonStyle, fill: colors[getColor(5)] }}
                    vectorEffect="non-scaling-stroke"
                    transform=" translate(-417.71, -650.04)"
                    d="M 417.71 814.15 C 556.86 814.15 683.54 868.6 777.7 957.0799999999999 C 787.9100000000001 938.93 796.61 920.4 803.7900000000001 900.7399999999999 C 810.6 882.9699999999999 816.2700000000001 864.8199999999999 820.4300000000001 845.9099999999999 C 824.59 826.9999999999998 827.61 807.3399999999998 828.7500000000001 787.2999999999998 C 829.8900000000001 777.0899999999998 830.2600000000001 766.1199999999999 830.2600000000001 755.5399999999998 C 830.2600000000001 595.5899999999999 738.7500000000001 456.42999999999984 605.2700000000001 387.98999999999984 C 587.5000000000001 378.91999999999985 569.3500000000001 371.34999999999985 550.0600000000001 364.91999999999985 C 532.2900000000001 358.48999999999984 513.7600000000001 353.9499999999998 494.8500000000001 350.16999999999985 C 469.8900000000001 345.6299999999998 444.18000000000006 342.98999999999984 417.7100000000001 342.98999999999984 C 190.0700000000001 342.98999999999984 5.160000000000082 528.2799999999999 5.160000000000082 755.5399999999998 C 5.160000000000082 828.5199999999999 24.070000000000082 897.3399999999999 57.720000000000084 957.0899999999999 C 151.88 868.6 278.55 814.15 417.71 814.15 z"
                    strokeLinecap="round"
                />
            </g>
            <g transform="matrix(0.5 0 0 0.5 842.3 679.23)">
                <path
                    style={{ ...commonStyle, fill: colors[getColor(2)] }}
                    vectorEffect="non-scaling-stroke"
                    transform=" translate(-1625.28, -1340.14)"
                    d="M 1943.49 1090.95 C 1931.77 1075.8300000000002 1919.29 1061.46 1905.68 1047.8400000000001 C 1831.19 973.3500000000001 1728.3300000000002 927.5900000000001 1614.89 927.5900000000001 C 1501.45 927.5900000000001 1398.97 973.3400000000001 1324.1000000000001 1047.8400000000001 C 1310.8600000000001 1061.0700000000002 1298.39 1075.44 1286.66 1090.5700000000002 C 1274.94 1105.69 1264.3500000000001 1121.5800000000002 1255.27 1138.5900000000001 C 1242.04 1161.2800000000002 1231.45 1185.4800000000002 1223.1299999999999 1210.8200000000002 C 1410.6799999999998 1290.9800000000002 1542.2799999999997 1477.41 1542.2799999999997 1694.0800000000002 C 1542.2799999999997 1711.4800000000002 1541.5299999999997 1728.8700000000001 1539.6399999999996 1745.88 C 1564.2199999999996 1750.42 1589.1799999999996 1752.69 1614.8899999999996 1752.69 C 1842.5299999999997 1752.69 2027.4399999999996 1567.78 2027.4399999999996 1340.14 C 2027.4399999999996 1266.7800000000002 2008.1499999999996 1197.96 1974.4999999999995 1138.5900000000001 C 1965.42 1121.95 1954.83 1106.07 1943.49 1090.95 z"
                    strokeLinecap="round"
                />
            </g>
            <g transform="matrix(0.5 0 0 0.5 233.31 679.24)">
                <path
                    style={{ ...commonStyle, fill: colors[getColor(4)] }}
                    vectorEffect="non-scaling-stroke"
                    transform=" translate(-407.31, -1340.14)"
                    d="M 809.46 1210.82 C 801.14 1185.48 790.5500000000001 1161.28 777.32 1138.59 C 768.25 1121.57 757.6600000000001 1105.6899999999998 745.9300000000001 1090.57 C 734.59 1075.4399999999998 722.11 1061.07 708.49 1047.84 C 634 973.35 531.15 927.59 417.71 927.59 C 304.27 927.59 201.42 973.34 126.91999999999996 1047.8400000000001 C 113.30999999999996 1061.0700000000002 100.82999999999996 1075.44 89.47999999999996 1090.5700000000002 C 77.75999999999996 1105.69 67.16999999999996 1121.5800000000002 58.08999999999996 1138.5900000000001 C 24.439999999999962 1197.96 5.149999999999963 1266.7800000000002 5.149999999999963 1340.14 C 5.149999999999963 1567.7800000000002 190.05999999999995 1752.69 417.7 1752.69 C 443.40999999999997 1752.69 468.37 1750.42 492.95 1745.88 C 491.06 1728.8600000000001 490.31 1711.47 490.31 1694.0800000000002 C 490.31 1477.4 621.9 1290.98 809.46 1210.82 z"
                    strokeLinecap="round"
                />
            </g>
            <g transform="matrix(0.5 0 0 0.5 537.8 856.3)">
                <path
                    style={{ ...commonStyle, fill: colors[getColor(3)] }}
                    vectorEffect="non-scaling-stroke"
                    transform=" translate(-1016.29, -1694.27)"
                    d="M 1202.72 1326.15 C 1184.95 1317.0800000000002 1166.42 1309.13 1147.13 1302.71 C 1129.3600000000001 1296.66 1110.45 1291.74 1091.5400000000002 1288.3400000000001 C 1066.9600000000003 1283.8000000000002 1042.0000000000002 1281.5300000000002 1016.2900000000002 1281.5300000000002 C 990.5800000000002 1281.5300000000002 965.6200000000002 1283.8000000000002 941.0400000000002 1288.3400000000001 C 922.1300000000002 1291.7400000000002 903.2300000000002 1296.66 885.4500000000002 1302.71 C 866.1700000000002 1309.14 847.6400000000001 1317.08 829.8600000000001 1326.15 C 695.6200000000001 1394.21 603.7300000000001 1533.75 603.7300000000001 1694.0800000000002 C 603.7300000000001 1698.6200000000001 603.7300000000001 1703.5300000000002 604.1100000000001 1708.0700000000002 C 604.4900000000001 1728.4900000000002 606.7600000000001 1748.5300000000002 610.5400000000001 1767.8200000000002 C 613.5600000000001 1786.7300000000002 618.4800000000001 1805.63 624.5300000000001 1823.4 C 679 1987.89 834.04 2107 1016.3 2107 C 1198.56 2107 1353.6 1987.89 1408.05 1823.4 C 1414.1 1805.63 1419.02 1786.72 1422.04 1767.8200000000002 C 1425.82 1748.16 1428.09 1728.1200000000001 1428.47 1707.7000000000003 C 1428.8500000000001 1703.1600000000003 1428.8500000000001 1698.6300000000003 1428.8500000000001 1694.0900000000004 C 1428.84 1533.75 1336.96 1394.21 1202.72 1326.15 z"
                    strokeLinecap="round"
                />
            </g>

            <g
                transform="matrix(8.96 0 0 8.96 723.18 812.52)"
                id="b816040d-9f14-48ce-8169-63ddfa99bb11"
            >
                <path
                    style={{
                        ...commonStyle,
                        stroke: "rgb(255,255,255)",
                        strokeWidth: 4,
                        fill: "rgb(0,0,0)",
                        opacity: status === CONNECTION_STATUS.connected ? 1 : 0,
                    }}
                    transform=" translate(-50, -50)"
                    d="M 14.148 44.105 L 18.091 40.162 C 20.01 38.242 23.176000000000002 38.242 25.096 40.162 L 42.164 57.230999999999995 L 74.904 24.440999999999995 C 76.823 22.521999999999995 79.98899999999999 22.521999999999995 81.90899999999999 24.440999999999995 L 85.851 28.383999999999997 C 87.771 30.302999999999997 87.771 33.415 85.851 35.334999999999994 L 45.641 75.54499999999999 L 45.537 75.64899999999999 L 45.433 75.75299999999999 L 45.329 75.80499999999999 L 45.277 75.90899999999999 L 45.173 75.961 L 45.069 76.065 L 44.965 76.117 L 44.861000000000004 76.16900000000001 L 44.757000000000005 76.27400000000002 L 44.653000000000006 76.32400000000001 L 44.54900000000001 76.37800000000001 L 44.44500000000001 76.43000000000002 L 44.34100000000001 76.48200000000003 L 44.23700000000001 76.53400000000003 L 44.08000000000001 76.58600000000004 L 43.97600000000001 76.63800000000005 L 43.872000000000014 76.69000000000005 L 43.768000000000015 76.74200000000006 L 43.664000000000016 76.74200000000006 L 43.56000000000002 76.79400000000007 L 43.405000000000015 76.84700000000007 L 43.301000000000016 76.84700000000007 L 43.19700000000002 76.89900000000007 L 42.93800000000002 76.89900000000007 L 42.83400000000002 76.95100000000008 L 42.62600000000002 76.95100000000008 L 42.47100000000002 77.00300000000009 L 41.795000000000016 77.00300000000009 L 41.640000000000015 76.95100000000008 L 41.432000000000016 76.95100000000008 L 41.32800000000002 76.89900000000007 L 41.06900000000002 76.89900000000007 L 40.96500000000002 76.84700000000007 L 40.86100000000002 76.84700000000007 L 40.70600000000002 76.79400000000007 L 40.60200000000002 76.74200000000006 L 40.49800000000002 76.74200000000006 L 40.39400000000002 76.69000000000005 L 40.29000000000002 76.63800000000005 L 40.185000000000024 76.58600000000004 L 40.081000000000024 76.53400000000003 L 40.029000000000025 76.53400000000003 C 39.563000000000024 76.32500000000003 39.096000000000025 75.96200000000003 38.630000000000024 75.54800000000003 L 14.140000000000025 51.059000000000026 C 12.229 49.137 12.229 46.025 14.148 44.105 z"
                    strokeLinecap="round"
                />
            </g>
        </svg>
    );
};

export default ConnectionIcon;
