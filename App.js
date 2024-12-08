import React, { useRef, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Animated } from 'react-native';
import Matter from 'matter-js';
import MovementArea from './MovementArea'; // Import the new MovementArea
import { PanResponder } from 'react-native';
import riverSegmentGenerator from './RiverSegmentGenerator'; // Import the riverSegmentGenerator
import ScrollingBackground from './ScrollingBackground';  // Import the scrolling background

const AIRPLANE_WIDTH = 50; // Width of the airplane

export default function App() {
  const [score, setScore] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [playerPosition, setPlayerPosition] = useState({ x: 100 });
  const [riverSegments, setRiverSegments] = useState([]); // Store the river segments
  const velocityRef = useRef(0); // Control smooth movement
  const animationFrame = useRef(null); // Reference to animation frame
  const [running, setRunning] = useState(true);
  const [bullets, setBullets] = useState([]); // Store bullets
  const engine = useRef(null);
  const world = useRef(null);
  const bulletSpeed = 5; // Speed at which bullets move

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const memoizedStyles = useMemo(() => styles(screenWidth, screenHeight), [screenWidth, screenHeight]);

  const entitiesRef = useRef(null);  // Ref to store entities

  const moveAirplane = () => {
    setPlayerPosition((prev) => {
      const newX = prev.x + velocityRef.current;

      // Clamp position to the screen boundaries
      const clampedX = Math.max(AIRPLANE_WIDTH / 2, Math.min(screenWidth - AIRPLANE_WIDTH / 2, newX));

      // Update Matter.js body position
      Matter.Body.setPosition(entitiesRef.current.player.body, { x: clampedX, y: prev.y });

      return { x: clampedX, y: prev.y };
    });

    animationFrame.current = requestAnimationFrame(moveAirplane);
  };

  const handleShoot = () => {
    console.log('Shoot action!');
    // Add logic for shooting here
  };

  const startMoving = (direction) => {
    velocityRef.current = direction === 'left' ? -5 : 5;
    if (!animationFrame.current) moveAirplane();
  };

  const stopMoving = () => {
    velocityRef.current = 0;
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

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

  // Function to generate and update river segments
  useEffect(() => {
    const generateRiver = () => {
      const segments = riverSegmentGenerator(screenWidth / 2, screenWidth, screenHeight / 2, screenHeight * 5, 100, 1, 2);
      setRiverSegments(segments);
    };

    generateRiver();
  }, [screenWidth, screenHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        initialTouch.current = { x: gestureState.x0, y: gestureState.y0 };
        lastTouch.current = initialTouch.current;
      },
      onPanResponderMove: (e, gestureState) => {
        const deltaX = gestureState.moveX - lastTouch.current.x;

        let newX = entitiesRef.current.player.body.position.x + deltaX;

        // Clamp within screen boundaries
        const halfWidth = entitiesRef.current.player.size[0] / 2;
        if (newX < halfWidth) newX = halfWidth;
        if (newX > screenWidth - halfWidth) newX = screenWidth - halfWidth;

        Matter.Body.setPosition(entitiesRef.current.player.body, { x: newX, y: entitiesRef.current.player.body.position.y });

        setPlayerPosition({ x: newX, y: entitiesRef.current.player.body.position.y });

        lastTouch.current = { x: gestureState.moveX, y: gestureState.moveY };
      },
    })
  ).current;

  const entities = useRef(setupWorld()).current;

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <View style={memoizedStyles.container}>
        {/* Other game components */}
        {/* Top Info Strip */}
        <View style={memoizedStyles.infoStrip}>
          <Text style={memoizedStyles.infoText}>Score: {score}</Text>
          <Text style={memoizedStyles.infoText}>Fuel: {fuel}</Text>
        </View>

        {/* Background Area */}
        <View style={memoizedStyles.background}>
          {/* Display the scrolling background with the river segments */}
          {riverSegments.length === 0 ? (
                <Text>Loading...</Text> // Show loading indicator while fetching data
            ): (<ScrollingBackground width={screenWidth} height={screenHeight} riverSegments={riverSegments} speed="1000"/>
          )}

          {/* Airplane */}
          <Image
            source={require('./assets/airplane.png')} // Replace with your airplane image
            style={[memoizedStyles.airplane, { left: playerPosition.x - AIRPLANE_WIDTH / 2 }]}
          />

          {/* Render river segments */}
          {riverSegments.map((segment, index) => (
            <View
              key={index}
              style={{
                position: 'absolute',
                top: segment.y,
                left: segment.x,
                width: segment.width,
                height: segment.height,
                backgroundColor: 'blue', // Customize river color
              }}
            />
          ))}
        </View>

        {/* Bottom Controls Strip */}
        <View style={memoizedStyles.controlsStrip}>
          {/* Left: Shoot Button */}
          <TouchableOpacity style={memoizedStyles.shootArea} onPress={handleShoot}>
            <Text style={memoizedStyles.controlText}>Shoot</Text>
          </TouchableOpacity>

          {/* Right: Movement Area */}
          <MovementArea
            onTapLeft={() => startMoving('left')}
            onTapRight={() => startMoving('right')}
            onHoldLeft={() => startMoving('left')}
            onHoldRight={() => startMoving('right')}
            onStop={stopMoving}
          />
        </View>
      </View>
    </View>
  );
}

const Physics = (entities, { time, events }) => {
  let { engine } = entities.physics;
  const { screenWidth, screenHeight } = entities;

  Matter.Engine.update(engine, time.delta);

  return entities;
};

const AirplaneImage = ({ body, size }) => {
  const x = body.position.x - size[0] / 2;
  const y = body.position.y - size[1] / 2;
  return (
    <Image
      source={require('./assets/airplane.png')}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size[0],
        height: size[1],
      }}
    />
  );
};

const styles = (screenWidth, screenHeight) => ({
  container: { flex: 1, backgroundColor: 'black' },

  // Top Info Strip
  infoStrip: {
    height: screenHeight * 0.05,
    backgroundColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  infoText: { color: 'white', fontSize: 16 },

  // Background Area
  background: { flex: 1, position: 'relative', overflow: 'hidden' },
  scrollingBackground: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    resizeMode: 'cover',
  },
  airplane: {
    position: 'absolute',
    bottom: 50,
    width: AIRPLANE_WIDTH,
    height: AIRPLANE_WIDTH,
  },

  // Bottom Controls Strip
  controlsStrip: {
    height: screenHeight * 0.2,
    flexDirection: 'row',
    backgroundColor: '#222',
  },
  shootArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#550000',
  },
  controlText: { color: 'white', fontSize: 18 },
});
