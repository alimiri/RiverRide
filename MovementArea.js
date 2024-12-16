import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

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
  const activeTouchRef = useRef(null);

  // Function to determine the area based on touch position
  const getSections = (locationX, locationY, areaWidth, areaHeight) => {
    const isLeft = locationX < areaWidth / 3;
    const isRight = locationX > areaWidth * 2 / 3;
    const isUpAcc = locationY < areaHeight / 3;
    const isDownAcc = locationY > areaHeight * 2 / 3;

    return { isLeft, isRight, isUpAcc, isDownAcc };
  };

  const handleTouchStart = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const { areaWidth, areaHeight } = areaDimensions;

    const touch = event.nativeEvent;
    activeTouchRef.current = touch.identifier; // Save the identifier

    console.log('Touch Start ID:', touch.identifier);

    const { isLeft, isRight, isUpAcc, isDownAcc } = getSections(locationX, locationY, areaWidth, areaHeight);

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
    const touch = event.nativeEvent;
    if(activeTouchRef.current !== touch.identifier)
    {
      console.log(`Move, not my touch: ${touch.identifier} expexted: ${activeTouchRef.current}`);
      return;
    }

    const { locationX, locationY } = touch;
    const { areaWidth, areaHeight } = areaDimensions;

    const { isLeft, isRight, isUpAcc, isDownAcc } = getSections(locationX, locationY, areaWidth, areaHeight);

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

  const handleTouchEnd = (event) => {
    const touch = event.nativeEvent;
    if(activeTouchRef.current !== touch.identifier)
    {
      console.log(`Touch end, not my touch: ${touch.identifier} expexted: ${activeTouchRef.current}`);
      return;
    }

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
    console.log('Area dimensions:', width, height);
    setAreaDimensions({ areaWidth: width, areaHeight: height });
  };

  return (
    <View
      style={styles.movementArea}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
    {Array.from({ length: 3 }).map((_, row) => (
      <View key={`row-${row}`} style={styles.row}>
        {Array.from({ length: 3 }).map((_, col) => (
          <View key={`col-${col}`} style={styles.cell}>
            <Text style={styles.cellText}>{`(${row + 1}, ${col + 1})`}</Text>
          </View>
        ))}
      </View>
    ))}
    </View>
  );
};

const styles = StyleSheet.create({
  movementArea: {
    flex: 2,
    backgroundColor: '#005500', // Green for testing
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'black', // Adjust for visibility
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    color: 'black',
    fontWeight: 'bold',
  },
});

export default MovementArea;
