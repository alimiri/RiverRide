import React, { useRef, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, PanResponder, Dimensions, Image, TouchableOpacity } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import { Animated } from 'react-native';

export default function App() {
  const [running, setRunning] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 400 }); // Track position in state
  const [bullets, setBullets] = useState([]); // Store bullets
  const engine = useRef(null);
  const world = useRef(null);
  const bulletSpeed = 5; // Speed at which bullets move

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const memoizedStyles = useMemo(() => styles(screenWidth, screenHeight), [screenWidth, screenHeight]);

  const entitiesRef = useRef(null);  // Ref to store entities

  const setupWorld = () => {
    const engine = Matter.Engine.create();
    const world = engine.world;

    engine.gravity.y = 0;
  const playerX = screenWidth / 2;
  const playerY = screenHeight * 0.8;

  // Create player airplane body
  const player = Matter.Bodies.rectangle(playerX, playerY, 50, 50);
  Matter.World.add(world, [player]);

  entitiesRef.current = {
    physics: { engine, world },
    player: { body: player, size: [50, 50], color: "blue", renderer: AirplaneImage },
    screenWidth,
    screenHeight,
  };

  return entitiesRef.current;  // Return ref object
  };

  const shootBullet = () => {
    if (!entitiesRef.current) return; // Prevent error if entitiesRef is null

    const playerBody = entitiesRef.current.player.body;

    const bullet = Matter.Bodies.rectangle(playerBody.position.x, playerBody.position.y - 25, 10, 20, {
      isStatic: false,
      render: { fillStyle: 'red' }
    });

    Matter.World.add(world.current, [bullet]);
    setBullets((prevBullets) => [...prevBullets, bullet]); // Add bullet to state
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

  const entities = useRef(setupWorld()).current;

  // Variables to store initial and last touch positions
  const initialTouch = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });

    // Handle bullet movement
    useEffect(() => {
      const interval = setInterval(() => {
        if (entitiesRef.current) {
          setBullets((prevBullets) => {
            return prevBullets
              .map((bullet) => {
                Matter.Body.translate(bullet, { x: 0, y: -bulletSpeed });
                return bullet;
              })
              .filter((bullet) => bullet.position.y > 0); // Remove bullets that move off screen
          });
        }
      }, 1000 / 60); // Update every frame

      return () => clearInterval(interval);
    }, []);


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

          // Calculate the new position only horizontally
          let newX = entitiesRef.current.player.body.position.x + deltaX;

          // Prevent the box from moving off the left and right edges
          const halfWidth = entitiesRef.current.player.size[0] / 2;
          if (newX < halfWidth) newX = halfWidth; // Left edge
          if (newX > screenWidth - halfWidth) newX = screenWidth - halfWidth; // Right edge

          // Fix vertical position to be 10% from the bottom
          const newY = screenHeight * 0.8;

          Matter.Body.setPosition(entitiesRef.current.player.body, { x: newX, y: newY });
          entitiesRef.current.player.body.position = { x: newX, y: newY }; // Sync to the ref

          initialTouch.current = { x: gestureState.moveX, y: gestureState.moveY };
        },
      })
    ).current;


  return (
    <View style={memoizedStyles.container} {...panResponder.panHandlers}>
      <ScrollingBackground />
      <GameEngine
        ref={engine}
        style={memoizedStyles.gameContainer}
        systems={[Physics]}
        entities={entities}
        running={running}
        onEvent={(e) => {
          if (e.type === "game-over") {
            setRunning(false);
          }
        }}
      >
        {!running && <Text style={memoizedStyles.gameOverText}>Game Over</Text>}
      </GameEngine>

      {/* Shoot Button */}
      <TouchableOpacity style={memoizedStyles.shootButton} onPress={shootBullet}>
        <Text style={memoizedStyles.shootButtonText}>Shoot</Text>
      </TouchableOpacity>
    </View>
  );
}

const Physics = (entities, { time }) => {
  let { engine } = entities.physics;

  // Update the physics engine
  Matter.Engine.update(engine, time.delta);

  // Sync the player's position with the body
  const player = entities.player;
  console.log("Before engine update:", player.body.position);

  // Update player position to the ref
  player.position = {
    x: player.body.position.x,
    y: player.body.position.y,
  };

  console.log("After engine update:", player.body.position);

  return entities;
};

const AirplaneImage = ({ body, size }) => {
  const x = body.position.x - size[0] / 2;
  const y = body.position.y - size[1] / 2;
  return (
    <Image
      source={require('./assets/airplane.png')}
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

  const styles = (screenWidth, screenHeight) => ({
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
  shootButton: {
    position: 'absolute',
    bottom: 50,
    left: screenWidth / 2 - 50,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  shootButtonText: {
    color: 'white',
    fontSize: 20,
  },
});
