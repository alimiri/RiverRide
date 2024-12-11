import React, { useEffect, useState, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Audio } from 'expo-av';
import RiverVisualization from './RiverVisualization'; // Import your RiverVisualization component

const ScrollingBackground = ({ width, height, riverSegments, speed, scrollY, totalHeight, isGameRunning }) => {
    const [sound, setSound] = useState();
    const animationRef = useRef(null); // Reference for animation instance

    useEffect(() => {
        // Load and play the sound
        const loadSound = async () => {
            const { sound } = await Audio.Sound.createAsync(
                require('./assets/airplane-engine.mp3'),
                { shouldPlay: true, isLooping: true } // Loop the sound
            );
            setSound(sound);
        };

        loadSound();

        // Create the animation only once
        if (!animationRef.current) {
            const animationConfig = {
                toValue: 0, // Final value to scroll to
                duration: (totalHeight - height) / height * 100 / speed * 1000,
                useNativeDriver: true,
            };

            animationRef.current = Animated.loop(
                Animated.timing(scrollY.current, animationConfig),
                { iterations: -1 }
            );
        }

        // Start or stop the animation based on `isGameRunning`
        if (isGameRunning) {
            animationRef.current.start();
        } else {
            animationRef.current.stop();
        }

        // Cleanup function
        return () => {
            if (sound) {
                sound.stopAsync(); // Stop sound when component is unmounted
                sound.unloadAsync(); // Release the sound resources
            }
            if (animationRef.current) {
                animationRef.current.stop(); // Stop the animation on unmount
            }
        };
    }, [isGameRunning, height, scrollY, speed, totalHeight]); // Re-run only if these dependencies change

    return (
        <View style={{ width, height, backgroundColor: 'lightblue', overflow: 'hidden' }}>
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width,
                    height: totalHeight, // Ensuring the total height is applied
                    transform: [{ rotate: '180deg' }, { translateY: scrollY.current }], // Apply vertical animation
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
