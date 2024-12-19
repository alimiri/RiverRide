import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import RiverVisualization from './RiverVisualization';
import treeImage from './assets/tree.png';

const ScrollingBackground = ({
    width,
    height,
    riverSegments,
    speed,
    isGameRunning,
    onScrollPositionChange,
    onDimensionsChange,
    resetFlag,
    resetRiver,
}) => {
    const currentAreaRef = useRef(null);

    const SCROLL_INITIAL_POSITION = riverSegments.totalHeight - height;
    const scrollPosition = useRef(SCROLL_INITIAL_POSITION); // Single source of truth for scroll position
    const [renderedScrollPosition, setRenderedScrollPosition] = useState(SCROLL_INITIAL_POSITION);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (currentAreaRef.current) {
            currentAreaRef.current.measure((x, y, width, height, pageX, pageY) => {
                onDimensionsChange({ x: pageX, y: pageY, width, height });
            });
        }
    }, []);

    // Memoize the long river construction
    const longRiver = useMemo(
        () => (
            <View style={{ transform: [{ rotate: '180deg' }] }}>
                <RiverVisualization
                    width={width}
                    riverSegments={riverSegments}
                    treeImage={treeImage}
                />
            </View>
        ),
        [width, riverSegments, resetRiver]
    );

    useEffect(() => {
        scrollPosition.current = SCROLL_INITIAL_POSITION;
        setRenderedScrollPosition(SCROLL_INITIAL_POSITION); // Trigger re-render
    }, [resetFlag]);

    let updateInterval = (1000 / height) * (100 / speed);
    let scrollAdjustment = 1;

    if (updateInterval < 1) {
        scrollAdjustment = Math.round(1 / updateInterval);
        updateInterval = 1;
    } else {
        updateInterval = Math.round(updateInterval);
    }

    updateInterval = Math.max(Math.floor(updateInterval), 1); // Clamp between 16ms and 1000ms

    const prevDependencies = useRef({ isGameRunning, speed });

    useEffect(() => {
        if (isGameRunning) {
            // Start scrolling
            intervalRef.current = setInterval(() => {
                scrollPosition.current -= scrollAdjustment;

                if (scrollPosition.current < 0) {
                    scrollPosition.current = SCROLL_INITIAL_POSITION;
                }

                setRenderedScrollPosition(scrollPosition.current); // Trigger re-render

                if (onScrollPositionChange) {
                    onScrollPositionChange(scrollPosition.current);
                }
            }, updateInterval);
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
        <View
            style={{
                width,
                height,
                backgroundColor: 'lightblue',
                overflow: 'hidden',
            }}
            ref={currentAreaRef}
        >
            <View
                style={{
                    position: 'absolute',
                    top: -renderedScrollPosition, // Use the state for rendering
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
