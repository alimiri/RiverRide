import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import RiverVisualization from './RiverVisualization';

const ScrollingBackground = ({
    width,
    riverSegments,
    speed,
    isGameRunning,
    onScrollPositionChange,
    onDimensionsChange,
    resetFlag,
}) => {
    const currentAreaRef = useRef(null);

    const initPosition = useRef(null);
    const scrollPosition = useRef(null);
    const [renderedScrollPosition, setRenderedScrollPosition] = useState(null);
    const intervalRef = useRef(null);
    const updateInterval = useRef(null);
    const scrollAdjustment = useRef(1);
    useEffect(() => {
        if (currentAreaRef.current) {
            currentAreaRef.current.measure((x, y, width, height, pageX, pageY) => {
                onDimensionsChange({ x: pageX, y: pageY, width, height });
                initPosition.current = riverSegments.totalHeight - height;
                scrollPosition.current = initPosition.current;
                setRenderedScrollPosition(initPosition.current);
                if (onScrollPositionChange) {
                    onScrollPositionChange(scrollPosition.current);
                }
                updateInterval.current = (1000 / height) * (100 / speed);

                if (updateInterval.current < 10) {
                    scrollAdjustment.current = Math.round(10 / updateInterval.current);
                    updateInterval.curent = 1;
                } else {
                    updateInterval.current = Math.round(updateInterval.current);
                }

                updateInterval.current = Math.max(Math.floor(updateInterval.current), 1);
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
                />
            </View>
        ),
        [width]
    );

    useEffect(() => {
        scrollPosition.current = initPosition.current;
        setRenderedScrollPosition(initPosition.current);
        if (onScrollPositionChange) {
            onScrollPositionChange(scrollPosition.current);
        }
    }, [resetFlag]);

    useEffect(() => {
        if (isGameRunning) {
            intervalRef.current = setInterval(() => {
                scrollPosition.current -= scrollAdjustment.current;

                if (!scrollPosition.current || scrollPosition.current < 0) {
                    scrollPosition.current = initPosition.current;
                }

                setRenderedScrollPosition(scrollPosition.current); // Trigger re-render
                if (onScrollPositionChange) {
                    onScrollPositionChange(scrollPosition.current);
                }
            }, updateInterval.current);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

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
                width: "100%",
                height: "100%",
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
