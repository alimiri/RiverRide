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
    const renderBridges = () => {
        const SECTION_COLORS = ["navy", "darkgreen"]; // Colors for the middle sections
        let bridges = [];
        riverSegments.river.forEach((segment, segmentIndex) => {
            segment.bridges.forEach((bridge, bridgeIndex) => {
                const n = bridge.points.length;
                for (let i = 0; i < n; i++) {
                    const polygonPoints = bridge.points[i].map((p) => `${p.x},${p.y}`).join(' ');
                    const fillColor =
                        i === 0 || i === n - 1
                            ? "brown" // Top and bottom sections are brown
                            : SECTION_COLORS[(i - 1) % SECTION_COLORS.length]; // Alternate green colors for middle sections
                    bridges.push(
                        <Svg
                            key={`bridge-${segmentIndex}-${bridgeIndex}-${i}`}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: segment.offset,
                                width: '100%',
                                height: segment.length,
                                zIndex: 100,
                            }}
                        >
                            <Polygon
                                points={polygonPoints}
                                fill={fillColor}
                            />
                        </Svg>
                    );
                }
            });
        });
        return bridges;
    };
/*
    const renderBridges = () => {
        const NUMBER_OF_SECTIONS = 10; // Total sections to divide into
        const SECTION_COLORS = ["darkBlue", "darkgreen"]; // Colors for the middle sections

        let bridges = [];
        riverSegments.river.forEach((segment, segmentIndex) => {
            segment.bridges.forEach((bridge, bridgeIndex) => {
                const [p1, p2, p3, p4] = bridge.points; // Destructure the 4 points

                // Calculate the vertical height of each section
                const bridgeHeight = p3.y - p1.y;
                const sectionHeight = bridgeHeight / NUMBER_OF_SECTIONS;

                // Generate sections
                for (let i = 0; i < NUMBER_OF_SECTIONS; i++) {
                    const sectionTopY = p1.y + i * sectionHeight;
                    const sectionBottomY = sectionTopY + sectionHeight;

                    // Determine the color for this section
                    const fillColor =
                        i === 0 || i === NUMBER_OF_SECTIONS - 1
                            ? "brown" // Top and bottom sections are brown
                            : SECTION_COLORS[(i - 1) % SECTION_COLORS.length]; // Alternate green colors for middle sections

                    // Define the points for the current section
                    const sectionPoints = [
                        { x: p1.x, y: sectionTopY },
                        { x: p2.x, y: sectionTopY },
                        { x: p3.x, y: sectionBottomY },
                        { x: p4.x, y: sectionBottomY },
                    ];
                    const polygonPoints = sectionPoints.map((p) => `${p.x},${p.y}`).join(" ");

                    // Add the section as an SVG polygon
                    bridges.push(
                        <Svg
                            key={`bridge-${segmentIndex}-${bridgeIndex}-section-${i}`}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: segment.offset,
                                width: "100%",
                                height: segment.length,
                                zIndex: 100,
                            }}
                        >
                            <Polygon points={polygonPoints} fill={fillColor} />
                        </Svg>
                    );
                }
            });
        });
        return bridges;
    };
*/
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
            {renderBridges()}
            {/*renderRuler()*/}
        </View>
    );
}

export default RiverVisualization;
