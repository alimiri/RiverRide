import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Audio } from 'expo-av';
import RiverVisualization from './RiverVisualization';
import treeImage from './assets/tree.png';

const ScrollingBackground = ({ width, height, riverSegments, speed, isGameRunning, onScrollPositionChange }) => {
    const [sound, setSound] = useState(null);
    const soundRef = useRef(null); // Reference for sound instance
    const scrollPosition = useRef(riverSegments.totalHeight - height); // Track scroll position
    const [currentScrollY, setCurrentScrollY] = useState(riverSegments.totalHeight - height); // Track UI position
    const intervalRef = useRef(null); // Reference for the scrolling interval

    // Memoize the long river construction
    const longRiver = useMemo(() => (
        <View style={{ transform: [{ rotate: '180deg' }] }}>
            <RiverVisualization
                width={width}
                riverSegments={riverSegments}
                treeImage={treeImage}
            />
        </View>
    ), [width, riverSegments]);

    // Load sound on mount and cleanup on unmount
    useEffect(() => {
        const loadSound = async () => {
            const { sound } = await Audio.Sound.createAsync(
                require('./assets/airplane-engine.mp3'),
                { shouldPlay: isGameRunning, isLooping: true }
            );
            soundRef.current = sound;
            setSound(sound);
        };

        loadSound();

        return () => {
            if (soundRef.current) {
                soundRef.current.stopAsync();
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    let updateInterval = 1000 / height * 100 / speed;
    let scrollAdjustment = 1;
    if(updateInterval < 1) {
        scrollAdjustment = Math.round(1 / updateInterval);
        updateInterval = 1;
    } else {
        updateInterval = Math.round(updateInterval);
    }
    updateInterval = Math.max(Math.floor(updateInterval), 1); // Clamp between 16ms and 1000ms
    const prevDependencies = useRef({ isGameRunning, speed });
    useEffect(() => {
        if (!prevDependencies.current.isGameRunning && isGameRunning) {
            scrollPosition.current = riverSegments.totalHeight - height; //reset to the first segment
        }

        if (isGameRunning) {
            // Start scrolling
            intervalRef.current = setInterval(() => {
                // Calculate the new scroll position
                scrollPosition.current -= scrollAdjustment; // Adjust based on speed
                if (scrollPosition.current < 0 ) {
                    scrollPosition.current = riverSegments.totalHeight - height; // Reset to start for infinite scroll
                }
                setCurrentScrollY(scrollPosition.current); // Update UI
                if (onScrollPositionChange) {
                    onScrollPositionChange(scrollPosition.current + height); // Notify parent
                }
            }, updateInterval); // Update every ~16ms (~60fps)
        } else {
            // Stop scrolling
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        prevDependencies.current = { isGameRunning, speed };
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isGameRunning, speed]);

    return (
        <View style={{ width, height, backgroundColor: 'lightblue', overflow: 'hidden' }}>
            <View
                style={{
                    position: 'absolute',
                    top: -currentScrollY, // Use manual scroll position
                    left: 0,
                    width,
                    height: riverSegments.totalHeight,
                }}
            >
            {longRiver}
            </View>
        </View>
    );
};

export default ScrollingBackground;
