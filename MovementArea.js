import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

const MovementArea = ({ onMoveAcc, onDimensionsChange, isGameRunning }) => {
  const [areaDimensions, setAreaDimensions] = useState({ areaWidth: 0, areaHeight: 0, offsetX: 0, offsetY: 0 });
  const intervalMoveRef = useRef(null);
  const currentArea = useRef(null);
  const currentAcc = useRef(null);
  const intervalAccRef = useRef(null);

  const getSections = (nativeEvent) => {
    const { pageX, pageY } = nativeEvent;
    const { areaWidth, areaHeight, offsetX, offsetY } = areaDimensions;

    const locationX = pageX - offsetX;
    const locationY = pageY - offsetY;

    const sections = {move: 'still', acc: 'noAcc'};
    if(locationX < areaWidth / 3) {
      sections.move =  'left';
    }
    if(locationX > areaWidth * 2 / 3) {
      sections.move = 'right';
    }
    if(locationY < areaHeight / 3) {
      sections.acc = 'up';
    }
    if(locationY > areaHeight * 2 / 3) {
      sections.acc = 'down';
    }
    return sections;
  };

  const handleTouchStart = (event) => {
    const { move, acc } = getSections(event.nativeEvent);
    if(intervalMoveRef.current) {
      clearInterval(intervalMoveRef.current);
      intervalMoveRef.current = null;
    }
    if(intervalAccRef.current) {
      clearInterval(intervalAccRef.current);
      intervalAccRef.current = null;
    }
    if(!isGameRunning) {
      return;
    }
    currentArea.current = move;
    onMoveAcc(move);
    intervalMoveRef.current = setInterval(() => onMoveAcc(move), 30);

    currentAcc.current = acc;
    onMoveAcc(acc);
    intervalAccRef.current = setInterval(() => onMoveAcc(acc), 30);
  };

  const handleTouchMove = (event) => {
    if(!isGameRunning) {
      if(intervalMoveRef.current) {
        clearInterval(intervalMoveRef.current);
        intervalMoveRef.current = null;
      }
      if(intervalAccRef.current) {
        clearInterval(intervalAccRef.current);
        intervalAccRef.current = null;
      }
      return;
    }

    const { move, acc } = getSections(event.nativeEvent);

    if (currentArea.current !== move) {
      currentArea.current = move;
      clearInterval(intervalMoveRef.current);
      onMoveAcc(move);
      intervalMoveRef.current = setInterval(() => onMoveAcc(move), 30);
    }

    if (currentAcc.current !== acc) {
      currentAcc.current = acc;
      clearInterval(intervalAccRef.current);
      onMoveAcc(acc);
      intervalAccRef.current = setInterval(() => onMoveAcc(acc), 30);
    }
  };

  const handleTouchEnd = (event) => {
    if(intervalMoveRef.current) {
      clearInterval(intervalMoveRef.current);
      intervalMoveRef.current = null;
    }
    if(intervalAccRef.current) {
      clearInterval(intervalAccRef.current);
      intervalAccRef.current = null;
    }
    currentArea.current = null;
    currentAcc.current = null;
  };

  useEffect(() => {
    if (currentArea.current) {
      currentArea.current.measure((x, y, width, height, pageX, pageY) => {
        setAreaDimensions({ areaWidth: width, areaHeight: height, offsetX: pageX, offsetY: pageY });
        onDimensionsChange({ x: pageX, y: pageY, width: width, height: height });
      });
    }
  }, []);

  const getAreaText = (row, col) => {
    if(row === 0 && col === 0) {
      return 'FAST LEFT';
    } else if(row === 0 && col === 1) {
      return 'FAST';
    } else if(row === 0 && col === 2) {
      return 'FAST RIGHT';
    } else if(row === 1 && col === 0) {
      return 'LEFT';
    } else if (row === 1 && col === 2) {
      return 'RIGHT';
    } else if(row === 2 && col === 0) {
      return 'SLOW LEFT';
    } else if(row === 2 && col === 1) {
      return 'SLOW';
    }else if(row === 2 && col === 2) {
      return 'SLOW RIGHT';
    }
    return '';
  };
  return (
    <View
      style={styles.movementArea}
      onStartShouldSetResponder={() => true}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      ref={currentArea}
      onDimensionsChange={onDimensionsChange}
    >
    {Array.from({ length: 3 }).map((_, row) => (
      <View key={`row-${row}`} style={styles.row}>
        {Array.from({ length: 3 }).map((_, col) => (
          <View key={`col-${col}`} style={styles.cell}>
            <Text style={styles.cellText}>{getAreaText(row, col)}</Text>
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
