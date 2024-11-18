import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, PanResponder, Dimensions, Image } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import { Animated } from 'react-native';
import airplaneImage from './airplane.png';

export default function App() {
  const [running, setRunning] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 400 }); // Track position in state
  const engine = useRef(null);
  const world = useRef(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const setupWorld = () => {
    const engine = Matter.Engine.create();
    const world = engine.world;

    // Disable gravity
    engine.gravity.y = 0;

    // Create player airplane body
    const player = Matter.Bodies.rectangle(100, 400, 50, 50);
    Matter.World.add(world, [player]);

    return {
      physics: { engine, world },
      player: { body: player, size: [50, 50], color: "blue", renderer: AirplaneImage },
      screenWidth,
      screenHeight
    };
  };

  const ScrollingBackground = () => {
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.timing(scrollY, {
          toValue: -600,
          duration: 5000,
          useNativeDriver: true,
        })
      ).start();
    }, []);

    return (
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 600,
          backgroundColor: 'lightblue',
          transform: [{ translateY: scrollY }],
        }}
      />
    );
  };

  const entities = setupWorld();

  // Variables to store initial and last touch positions
  const initialTouch = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });

  // PanResponder to handle touch and drag movements
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        initialTouch.current = { x: gestureState.x0, y: gestureState.y0 };
        lastTouch.current = initialTouch.current;
      },
      onPanResponderMove: (e, gestureState) => {
        const deltaX = gestureState.moveX - initialTouch.current.x;
        const deltaY = gestureState.moveY - initialTouch.current.y;

        // Calculate the new position
        let newX = entities.player.body.position.x + deltaX;
        let newY = entities.player.body.position.y + deltaY;

        // Prevent the box from moving off the left and right edges
        const halfWidth = entities.player.size[0] / 2;
        if (newX < halfWidth) newX = halfWidth; // Left edge
        if (newX > screenWidth - halfWidth) newX = screenWidth - halfWidth; // Right edge

        // Update the position using Matter.Body.setPosition
        Matter.Body.setPosition(entities.player.body, { x: newX, y: newY });

        // Update state to re-render the box in React
        setPlayerPosition({ x: newX, y: newY });

        initialTouch.current = { x: gestureState.moveX, y: gestureState.moveY };
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <ScrollingBackground />
      <GameEngine
        ref={engine}
        style={styles.gameContainer}
        systems={[Physics]}
        entities={entities}
        running={running}
        onEvent={(e) => {
          if (e.type === "game-over") {
            setRunning(false);
          }
        }}
      >
        {!running && <Text style={styles.gameOverText}>Game Over</Text>}
      </GameEngine>
    </View>
  );
}

// Physics system
const Physics = (entities, { time, events }) => {
  let { engine } = entities.physics;
  const { screenWidth, screenHeight } = entities;

  Matter.Engine.update(engine, time.delta);

  return entities;
};

// Airplane Renderer with Image
const AirplaneImage = ({ body, size, color }) => {
    const x = body.position.x - size[0] / 2;
    const y = body.position.y - size[1] / 2;

    return (
      <Image
        source={require('./airplane.png')} // Replace with your local asset or external URL
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size[0],
          height: size[1],
        }}
      />
    );
  };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  gameContainer: { flex: 1 },
  gameOverText: {
    color: "white",
    fontSize: 30,
    textAlign: "center",
    position: "absolute",
    top: "50%",
    width: "100%",
  },
});
