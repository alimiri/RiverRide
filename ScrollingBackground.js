import React, { useEffect, useState } from 'react';
import { View, Animated } from 'react-native';
import RiverPath from './RiverPath';  // Import the river path component

const ScrollingBackground = ({ width, height }) => {
  const [scrollX] = useState(new Animated.Value(0)); // Create an animated value to control the scrolling

  useEffect(() => {
    // Define the scrolling animation
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: width,  // Scroll to the end of the river path
        duration: 5000,   // Adjust duration for the speed of the scroll
        useNativeDriver: true,
      })
    ).start();
  }, [scrollX, width]);

  return (
    <View style={{ flex: 1, backgroundColor: 'lightblue', overflow: 'hidden' }}>
      {/* Create a wrapper for the scrolling river */}
      <Animated.View
        style={{
          transform: [{ translateX: scrollX }],  // Apply the scrolling effect
          flexDirection: 'row', // Arrange the paths side by side for continuous scroll
        }}
      >
        {/* Repeat the river to create an illusion of infinite scrolling */}
        <RiverPath width={width} height={height} />
        <RiverPath width={width} height={height} />
      </Animated.View>
    </View>
  );
};

export default ScrollingBackground;
