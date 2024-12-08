import React from 'react';
import { View } from 'react-native';

export default function RiverVisualization({ width, totalHeight, riverSegments }) {
    return (
        <View style={{ width, height: totalHeight, flexDirection: 'column', alignItems: 'center' }}>
            {riverSegments.map((segment, index) => {
                const segmentWidth = (segment.startWidth + segment.endWidth) / 2; // Average width for the segment
                return (
                    <View
                        key={index}
                        style={{
                            width: segmentWidth,
                            height: segment.length, // Length determines height
                            backgroundColor: 'blue', // River color
                            marginBottom: 1, // Slight spacing for visual clarity
                        }}
                    />
                );
            })}
        </View>
    );
}