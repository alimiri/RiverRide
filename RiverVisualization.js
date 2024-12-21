import React from 'react';
import { View, Image, Text } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

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

    const renderRuler = () => {
        let nodes = [];
        for (let index = 0; index < 100; index++) {
            nodes.push(
                <View
                    key={`line-${index}`}
                    style={{
                        position: 'absolute',
                        top: index * 100, // Adjust distance between lines
                        left: 0,
                        width: '100%',
                        height: 50, // Height of each line section
                    }}
                >
                    {/* Line */}
                    <View
                        style={{
                            width: '100%',
                            height: 3,
                            backgroundColor: 'red',
                            position: 'absolute',
                        }}
                    />
                    {/* Index Number */}
                    <Text
                        style={{
                            position: 'absolute',
                            top: 10, // Adjust to move the number above or below the line
                            left: 10, // Adjust horizontal positioning
                            color: 'black',
                            fontSize: 12,
                            fontWeight: 'bold',
                            zIndex: 100, // Ensure this is above other components
                        }}
                    >
                        {index}
                    </Text>
                </View>
            );
        }
        return nodes;
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
            {/*renderRuler()*/}
        </View>
    );
}

export default RiverVisualization;
