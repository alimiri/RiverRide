import React, { useEffect, useState } from 'react';
import { View, Animated } from 'react-native';
import RiverVisualization from './RiverVisualization'; // Import your RiverVisualization component

const ScrollingBackground = ({ width, height, riverSegments, speed = 5000 }) => {
    const [scrollY] = useState(new Animated.Value(0)); // Create an animated value for vertical scrolling

    useEffect(() => {
        // Define the vertical scrolling animation
        Animated.loop(
            Animated.timing(scrollY, {
                toValue: -height, // Scroll upward by the height of the screen
                duration: speed,  // Duration controls the speed of the scroll
                useNativeDriver: true,
            })
        ).start();
    }, [scrollY, height, speed]);

    return (
        <View style={{ width, height, backgroundColor: 'lightblue', overflow: 'hidden' }}>
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width,
                    height: height * 2, // Double the height for seamless looping
                    transform: [{ translateY: scrollY }], // Apply vertical scrolling animation
                }}
            >
                {/* Render the river visualization across the extended height */}
                <RiverVisualization
                    width={width}
                    height={height}
                    riverSegments={riverSegments}
                />
            </Animated.View>
        </View>
    );
};

export default ScrollingBackground;
