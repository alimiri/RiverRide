import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

const MovementArea = ({ onMove, onChangeSpeed, onDimensionsChange, isGameRunning }) => {
  const [areaDimensions, setAreaDimensions] = useState({ areaWidth: 0, areaHeight: 0, offsetX: 0, offsetY: 0 });
  const currentArea = useRef(null);
  const lastPosition = useRef({ x: 0, y: 0 });

  const getPosition = (event) => {
    return { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
  };

  const handleTouchStart = (event) => {
    if (!isGameRunning) {
      return;
    }
    lastPosition.current = getPosition(event);
  };

  const handleTouchMove = (event) => {
    if (!isGameRunning) {
      return;
    }
    const currentPosition = getPosition(event);
    onMove(currentPosition.x - lastPosition.current.x);
    onChangeSpeed(-(currentPosition.y - lastPosition.current.y));
    lastPosition.current = currentPosition;
  };

  useEffect(() => {
    if (currentArea.current) {
      currentArea.current.measure((x, y, width, height, pageX, pageY) => {
        setAreaDimensions({ areaWidth: width, areaHeight: height, offsetX: pageX, offsetY: pageY });
        onDimensionsChange({ x: pageX, y: pageY, width: width, height: height });
      });
    }
  }, []);

  return (
    <View
      style={styles.movementArea}
      onStartShouldSetResponder={() => true}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      ref={currentArea}
      onDimensionsChange={onDimensionsChange}
    >
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
