import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, PanResponder } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import { Animated } from 'react-native';

export default function App() {
  const [running, setRunning] = useState(true);
  const engine = useRef(null);
  const world = useRef(null);

    // Variables to store the initial touch position
    const initialTouch = useRef({ x: 0, y: 0 });
    const lastTouch = useRef({ x: 0, y: 0 });
  // Initialize physics engine and player
  const setupWorld = () => {
    const engine = Matter.Engine.create();
    const world = engine.world;

    // Disable gravity
    engine.gravity.y = 0;

    // Create player airplane
    const player = Matter.Bodies.rectangle(100, 400, 50, 50);
    Matter.World.add(world, [player]);

    return {
      physics: { engine, world },
      player: { body: player, size: [50, 50], color: "blue", renderer: Box },
    };
  };

  const ScrollingBackground = () => {
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.timing(scrollY, {
          toValue: -600, // Negative height of the background
          duration: 5000, // 5 seconds for one full scroll
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
          height: 600, // Adjust to fit your screen
          backgroundColor: 'lightblue', // Replace with your river image
          transform: [{ translateY: scrollY }],
        }}
      />
    );
  };

  const entities = setupWorld();

  // PanResponder to handle touch and drag movements
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        // Capture the initial touch position
        initialTouch.current = { x: gestureState.x0, y: gestureState.y0 };
        lastTouch.current = initialTouch.current;
      },
      onPanResponderMove: (e, gestureState) => {
        const deltaX = gestureState.moveX - lastTouch.current.x;
        const deltaY = gestureState.moveY - lastTouch.current.y;

        // Dispatch the move player event based on the difference
        engine.current.dispatch({
          type: "move-player",
          payload: { deltaX, deltaY },
        });

        // Update the last touch position
        lastTouch.current = { x: gestureState.moveX, y: gestureState.moveY };
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

  Matter.Engine.update(engine, time.delta);

  let player = entities.player.body;

  // Process "move-player" event to update the player's position
  events.forEach((event) => {
    if (event.type === "move-player") {
      const { deltaX, deltaY } = event.payload;

      // Apply the difference (delta) to the player's position
      Matter.Body.translate(player, { x: deltaX, y: deltaY });
    }
  });

  return entities;
};

// Box Renderer for Airplane
const Box = ({ body, size, color }) => {
    const x = body.position.x - size[0] / 2;
    const y = body.position.y - size[1] / 2;
    return (
      <View
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size[0],
          height: size[1],
          backgroundColor: color,
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
