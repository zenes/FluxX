'use client';

import React from 'react';

export const Sparkline = ({ isUp, data }: { isUp: boolean, data?: number[] }) => {
    const color = isUp ? "#FF3B2F" : "#35C759";
    const gradientId = `sparkline-gradient-${isUp ? (data ? 'real' : 'sim') : (data ? 'real-down' : 'sim-down')}-${Math.random().toString(36).substr(2, 9)}`;

    // Normalize data points to fit the 0-20 height range if real data provided
    const normalizedPoints = React.useMemo(() => {
        if (!data || data.length === 0) return null;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;

        if (range === 0) return data.map(() => 10);

        // Map min value to height-2 (18) and max to 2 to leave some padding
        return data.map(p => 2 + (1 - (p - min) / range) * 16);
    }, [data]);

    // Generate a very detailed realistic path if no data is provided
    const points = React.useMemo(() => {
        if (normalizedPoints) return normalizedPoints;

        // Simulation: 30 points with random walk
        const count = 30;
        const pts = [isUp ? 15 : 5]; // Start point
        let current = pts[0];
        const trend = isUp ? -0.3 : 0.3; // Bias for the trend (0 is bottom, 20 is top, so negative is "up")

        for (let i = 1; i < count; i++) {
            const vol = 1.5;
            const change = (Math.random() - 0.5) * vol + trend;
            current = Math.max(2, Math.min(18, current + change));
            pts.push(current);
        }

        // Ensure the last point reflects the isUp state relative to start
        if (isUp) pts[count - 1] = Math.min(pts[count - 1], pts[0] - 2);
        else pts[count - 1] = Math.max(pts[count - 1], pts[0] + 2);

        return pts;
    }, [isUp, normalizedPoints]);

    const width = 56;
    const height = 20;
    const step = width / (points.length - 1);

    let pathData = `M 0 ${points[0]}`;
    points.forEach((p, i) => {
        if (i === 0) return;
        pathData += ` L ${i * step} ${p}`;
    });

    const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d={areaPath}
                fill={`url(#${gradientId})`}
                className="opacity-60"
            />
            <path
                d={pathData}
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
