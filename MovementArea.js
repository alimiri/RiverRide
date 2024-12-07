import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

const MovementArea = ({ onTapLeft, onTapRight, onHoldLeft, onHoldRight, onStop }) => {
  const intervalRef = useRef(null);
  const currentArea = useRef(null);

  const handleTouchStart = (event) => {
    const { locationX, target } = event.nativeEvent;
    const screenWidth = target.offsetWidth || 300; // Replace with actual screen width
    const isLeft = locationX < screenWidth / 2;

    if (isLeft) {
      currentArea.current = 'left';
      onTapLeft();
      intervalRef.current = setInterval(onHoldLeft, 100); // Trigger every 100ms
    } else {
      currentArea.current = 'right';
      onTapRight();
      intervalRef.current = setInterval(onHoldRight, 100);
    }
  };

  const handleTouchMove = (event) => {
    const { locationX, target } = event.nativeEvent;
    const screenWidth = target.offsetWidth || 300;
    const isLeft = locationX < screenWidth / 2;

    if (isLeft && currentArea.current !== 'left') {
      currentArea.current = 'left';
      clearInterval(intervalRef.current);
      onTapLeft();
      intervalRef.current = setInterval(onHoldLeft, 100);
    } else if (!isLeft && currentArea.current !== 'right') {
      currentArea.current = 'right';
      clearInterval(intervalRef.current);
      onTapRight();
      intervalRef.current = setInterval(onHoldRight, 100);
    }
  };

  const handleTouchEnd = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    currentArea.current = null;
    onStop(); // Stop airplane movement
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, []);

  return (
    <View
      style={styles.movementArea}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      onResponderRelease={handleTouchEnd}
      onResponderTerminate={handleTouchEnd}
    />
  );
};

const styles = StyleSheet.create({
  movementArea: {
    flex: 2,
    backgroundColor: '#005500', // Green for testing
  },
});

export default MovementArea;
