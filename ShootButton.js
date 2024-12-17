import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ShootButton = ({ onShoot, isGameRunning }) => {
  const [isShooting, setIsShooting] = useState(false);

  const handleTouchStart = () => {
    setIsShooting(true);
    onShoot();
  };

  const handleTouchEnd = () => {
    setIsShooting(false);
  };

  useEffect(() => {
    let interval;
    if (isShooting && isGameRunning) {
      interval = setInterval(() => {
        onShoot();
      }, 100); // Adjust the shooting interval as needed
    }
    return () => {
      clearInterval(interval); // Cleanup interval on unmount or when shooting stops
    };
  }, [isShooting, isGameRunning]);

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
