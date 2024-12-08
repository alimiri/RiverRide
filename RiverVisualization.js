import React from 'react';
import { View } from 'react-native';

export default function RiverVisualization({ width, height, riverSegments }) {
    return (
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            {riverSegments.map((segment, index) => (
                <View
                    key={index}
                    style={{
                        width: (segment.startWidth + segment.endWidth) / 2, // Average width for the segment
                        height: segment.length, // Length determines height
                        backgroundColor: 'blue', // River color
                        marginBottom: 1, // Slight spacing for visual clarity
                    }}
                />
            ))}
        </View>
    );
}