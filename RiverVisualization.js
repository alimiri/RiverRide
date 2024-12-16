import React from 'react';
import { View, Image } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';

const RiverSegment = ({ startWidth, endWidth, length, screenWidth, bridges }) => {
    const startX = (screenWidth - startWidth) / 2;
    const endX = (screenWidth - endWidth) / 2;

    const points = [
        { x: startX, y: 0 },
        { x: startX + startWidth, y: 0 },
        { x: endX + endWidth, y: length },
        { x: endX, y: length },
    ];

    const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

    return (
        <Svg height={length} width={screenWidth}>
            <Polygon points={polygonPoints} fill="blue" />
        </Svg>
    );
};

function RiverVisualization({ width, riverSegments, treeImage }) {
    const renderBridges = () => {
        let bridges = [];
        riverSegments.river.forEach((segment, segmentIndex) => {
            segment.bridges.forEach((bridge, bridgeIndex) => {
                const y = bridge.y1 + segment.offset;
                const height = bridge.y2 - bridge.y1; // Correct calculation for height
                const x = bridge.x1;
                const width = bridge.x2 - bridge.x1; // Correct calculation for width
                console.log(x, y, width, height); // Log for debugging

                bridges.push(
                    <View
                        key={`bridge-${segmentIndex}-${bridgeIndex}`}
                        style={{
                            position: 'absolute',
                            left: x,
                            top: y,
                            width: width,
                            height: height,
                            backgroundColor: 'brown', // Use `backgroundColor` instead of `fill`
                            zIndex: 100,
                        }}
                    />
                );
            });
        });
        return bridges;
    };

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
                        }}
                    />
                );
            });
        });

        return trees;
    };

    return (
        <View style={{ width, height: riverSegments.totalHeight, flexDirection: 'column', alignItems: 'center' }}>
            {riverSegments.river.map((segment, index) => {
                return (
                    <RiverSegment
                        key={index}
                        startWidth={segment.startWidth}
                        endWidth={segment.endWidth}
                        length={segment.length}
                        screenWidth={width}
                        bridges={segment.bridges}
                    />
                );
            })}
            {renderTrees()}
            {renderBridges()}
        </View>
    );
}

export default RiverVisualization;
