import React, { useEffect, useState } from 'react';
import { View, Animated } from 'react-native';
import RiverVisualization from './RiverVisualization'; // Import your RiverVisualization component

const ScrollingBackground = ({ width, height, riverSegments, speed = 5000 }) => {
    const totalHeight = riverSegments.reduce((acc, segment) => acc + segment.length, 0); // Total height of river segments
    const [scrollY] = useState(new Animated.Value(totalHeight - height)); // Animated value for vertical scrolling

    useEffect(() => {
        const animationConfig = {
            toValue: 0, // Final value to scroll to
            duration: (totalHeight - height) / height * speed,
            useNativeDriver: true,
        };

        // Start the animation
        Animated.loop(
            Animated.timing(scrollY, animationConfig),
            { iterations: -1 } // Infinite loop
        ).start();

        return () => scrollY.stop();  // Cleanup on unmount
    }, [riverSegments, height, scrollY, speed]); // Include riverSegments to replay animation if changed
    return (
        <View style={{ width, height, backgroundColor: 'lightblue', overflow: 'hidden' }}>
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width,
                    height: totalHeight, // Ensuring the total height is applied
                    transform: [{ rotate: '180deg' }, { translateY: scrollY }], // Apply vertical animation
                }}
            >
                {/* Render river visualization with total height */}
                <RiverVisualization
                    width={width}
                    totalHeight={totalHeight}
                    riverSegments={riverSegments} // Do not pass height here, let the RiverVisualization calculate it
                />
            </Animated.View>
        </View>
    );
};

export default ScrollingBackground;