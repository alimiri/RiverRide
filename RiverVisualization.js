import React from 'react';
import { View, Image } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const RiverSegment = ({ startWidth, endWidth, length, screenWidth, yOffset }) => {
    const startX = (screenWidth - startWidth) / 2;
    const endX = (screenWidth - endWidth) / 2;

    const points = [
        { x: startX, y: 0 },
        { x: startX + startWidth, y: 0 },
        { x: endX + endWidth, y: length },
        { x: endX, y: length },
    ];

    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <Svg height={length} width={screenWidth} style={{ position: 'absolute', top: yOffset }}>
            <Polygon points={polygonPoints} fill="blue" />
        </Svg>
    );
};

function RiverVisualization({ width, riverSegments, treeImage }) {
    let yOffset = 0;

    const renderTrees = () => {
        let trees = [];
        riverSegments.river.forEach((segment, segmentIndex) => {
            segment.trees.forEach((tree, treeIndex) => {
                const treeY = tree.y + segment.offset;
                trees.push(
                    <Image
                        key={`tree-${segmentIndex}-${treeIndex}`}
                        source={treeImage} // Pass image as prop
                        style={{
                            position: 'absolute',
                            left: tree.x,
                            top: treeY,
                            width: 50,
                            height: 50,
                            transform: [{ rotate: '180deg' }], // Apply 180 degree rotation
                            zIndex: 10
                        }}
                    />
                );
            });

            // After rendering trees for the current segment, update the yOffset
            yOffset += segment.length;
        });

        return trees;
    };

    return (
        <View style={{ width, height: riverSegments.totalHeight, flexDirection: 'column', alignItems: 'center' }}>
            {riverSegments.river.map((segment, index) => {
                // Render each segment with its accumulated yOffset
                const segmentYOffset = yOffset; // The offset is calculated once before rendering each segment

                // Update the yOffset after rendering the segment to keep track of the total height
                yOffset += segment.length;

                return (
                    <RiverSegment
                        key={index}
                        startWidth={segment.startWidth}
                        endWidth={segment.endWidth}
                        length={segment.length}
                        screenWidth={width}
                        yOffset={segmentYOffset} // Pass the accumulated yOffset
                    />
                );
            })}
            {renderTrees()}
        </View>
    );
}

export default RiverVisualization;
