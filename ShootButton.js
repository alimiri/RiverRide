import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const ShootButton = ({ onShoot }) => {
  const [isShooting, setIsShooting] = useState(false);

  const onPressIn = () => {
    console.log('Shoot button pressed');
    setIsShooting(true);
    onShoot(); // Shoot immediately on press
  };

  const onPressOut = () => {
    console.log('Shoot button released');
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
    <TouchableOpacity
      style={styles.shootButton}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Text style={styles.text}>Shoot</Text>
    </TouchableOpacity>
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
