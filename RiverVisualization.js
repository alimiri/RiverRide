import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const RiverSegment = ({ startWidth, endWidth, length, screenWidth }) => {
    // Calculate the starting and ending points for the trapezoidal shape
    const startX = (screenWidth - startWidth) / 2;
    const endX = (screenWidth - endWidth) / 2;

    // The points for the trapezoidal polygon
    const points = [
        { x: startX, y: 0 }, // Top-left corner
        { x: startX + startWidth, y: 0 }, // Top-right corner
        { x: endX + endWidth, y: length }, // Bottom-right corner
        { x: endX, y: length }, // Bottom-left corner
    ];

    // Transform the points into a string format required by the SVG Polygon
    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <Svg height={length} width={screenWidth}>
            <Polygon points={polygonPoints} fill="blue" />
        </Svg>
    );
};

function RiverVisualization({ width, totalHeight, riverSegments }) {
    return (
        <View style={{ width, height: totalHeight, flexDirection: 'column', alignItems: 'center' }}>
            {riverSegments.map((segment, index) => {
                return (
                    <RiverSegment
                        key={index}
                        startWidth={segment.startWidth}
                        endWidth={segment.endWidth}
                        length={segment.length}
                        screenWidth={width} // Pass the screen width for calculation
                    />
                );
            })}
        </View>
    );
}

export default RiverVisualization;
