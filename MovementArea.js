import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

const MovementArea = ({
  onTapLeft, onTapRight, onTapMiddle,
  onHoldLeft, onHoldRight, onHoldMiddle,
  onTapUp, onTapDown, onTapNoAcc,
  onHoldUp, onHoldDown, onHoldNoAcc, onStop
}) => {
  const [areaDimensions, setAreaDimensions] = useState({ areaWidth: 0, areaHeight: 0 });
  const intervalRef = useRef(null);
  const currentArea = useRef(null);
  const currentAcc = useRef(null);
  const intervalAccRef = useRef(null);

  // Function to determine the area based on touch position
  const getArea = (locationX, locationY, areaWidth, areaHeight) => {
    const isLeft = locationX < areaWidth / 3;
    const isRight = locationX > areaWidth * 2 / 3;
    const isUpAcc = locationY < areaHeight / 3;
    const isDownAcc = locationY > areaHeight * 2 / 3;

    return { isLeft, isRight, isUpAcc, isDownAcc };
  };

  const handleTouchStart = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const { areaWidth, areaHeight } = areaDimensions;

    const { isLeft, isRight, isUpAcc, isDownAcc } = getArea(locationX, locationY, areaWidth, areaHeight);

    if (isLeft) {
      currentArea.current = 'left';
      onTapLeft();
      intervalRef.current = setInterval(onHoldLeft, 100);
    } else if (isRight) {
      currentArea.current = 'right';
      onTapRight();
      intervalRef.current = setInterval(onHoldRight, 100);
    } else {
      currentArea.current = 'still';
      onTapMiddle();
      intervalRef.current = setInterval(onHoldMiddle, 100);
    }

    if (isUpAcc) {
      currentAcc.current = 'up';
      onTapUp();
      intervalAccRef.current = setInterval(onHoldUp, 30);
    } else if (isDownAcc) {
      currentAcc.current = 'down';
      onTapDown();
      intervalAccRef.current = setInterval(onHoldDown, 30);
    } else {
      currentAcc.current = 'noAcc';
      onTapNoAcc();
      intervalAccRef.current = setInterval(onHoldNoAcc, 30);
    }
  };

  const handleTouchMove = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const { areaWidth, areaHeight } = areaDimensions;

    const { isLeft, isRight, isUpAcc, isDownAcc } = getArea(locationX, locationY, areaWidth, areaHeight);

    // Handle touch area transitions
    if (isLeft && currentArea.current !== 'left') {
      currentArea.current = 'left';
      clearInterval(intervalRef.current);
      onTapLeft();
      intervalRef.current = setInterval(onHoldLeft, 100);
    } else if (isRight && currentArea.current !== 'right') {
      currentArea.current = 'right';
      clearInterval(intervalRef.current);
      onTapRight();
      intervalRef.current = setInterval(onHoldRight, 100);
    } else if (!isRight && !isLeft && currentArea.current !== 'still') {
      currentArea.current = 'still';
      clearInterval(intervalRef.current);
      onTapMiddle();
      intervalRef.current = setInterval(onHoldMiddle, 100);
    }

    if (isUpAcc && currentAcc.current !== 'up') {
      currentAcc.current = 'up';
      clearInterval(intervalAccRef.current);
      onTapUp();
      intervalAccRef.current = setInterval(onHoldUp, 30);
    } else if (isDownAcc && currentAcc.current !== 'down') {
      currentAcc.current = 'down';
      clearInterval(intervalAccRef.current);
      onTapDown();
      intervalAccRef.current = setInterval(onHoldDown, 30);
    } else if (!isUpAcc && !isDownAcc && currentAcc.current !== 'noAcc') {
      currentAcc.current = 'noAcc';
      clearInterval(intervalAccRef.current);
      onTapNoAcc();
      intervalAccRef.current = setInterval(onHoldNoAcc, 30);
    }
  };

  const handleTouchEnd = () => {
    // Clear intervals and reset state when touch ends
    clearInterval(intervalRef.current);
    clearInterval(intervalAccRef.current);
    intervalRef.current = null;
    intervalAccRef.current = null;
    currentArea.current = null;
    currentAcc.current = null;

    onStop(); // Stop airplane movement
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(intervalAccRef.current);
    };
  }, []);

  const onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setAreaDimensions({ areaWidth: width, areaHeight: height });
  };

  return (
    <View
      style={styles.movementArea}
      onLayout={onLayout}
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
