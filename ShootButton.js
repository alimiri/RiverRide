import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ShootButton = ({ onShoot }) => {
  const [isShooting, setIsShooting] = useState(false);
  const activeTouchRef = useRef(null);

  const handleTouchStart = (event) => {
    const touch = event.nativeEvent;
    activeTouchRef.current = touch.identifier; // Save the identifier

    console.log('Press In ID:', touch.identifier);

    setIsShooting(true);
    onShoot(); // Shoot immediately on press
  };

  const handleTouchEnd = (event) => {
    const touch = event.nativeEvent;
    if(activeTouchRef.current !== touch.identifier)
    {
      console.log(`Press Out, not my touch: ${touch.identifier} expexted: ${activeTouchRef.current}`);
      return;
    }
    console.log('Press Out ID:', touch.identifier);
    setIsShooting(false);
  };

  // Continuous shooting logic
  useEffect(() => {
    let interval;
    if (isShooting) {
      interval = setInterval(() => {
        onShoot();
      }, 100); // Adjust the shooting interval as needed
    }
    return () => {
      clearInterval(interval); // Cleanup interval on unmount or when shooting stops
    };
  }, [isShooting]);

  return (
    <View
      style={styles.shootButton}
      onStartShouldSetResponder={() => true}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCandel={handleTouchEnd}
    >
      <Text style={styles.text}>Shoot</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  shootButton: {
    backgroundColor: 'red',
    padding: 20,
    borderRadius: 10,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ShootButton;
