import React, { useRef, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Animated, Platform, Alert } from 'react-native';
import Matter from 'matter-js';
import MovementArea from './MovementArea'; // Import the new MovementArea
import { PanResponder } from 'react-native';
import riverSegmentGenerator from './RiverSegmentGenerator'; // Import the riverSegmentGenerator
import ScrollingBackground from './ScrollingBackground';  // Import the scrolling background


const AIRPLANE_WIDTH = 50; // Width of the airplane
// Dynamic status bar height
const isIOS = Platform.OS === 'ios';
const STATUSBAR_HEIGHT = isIOS ? 20 : StatusBar.currentHeight;
const MAX_SPEED = 150;
const MIN_SPEED = 50;

export default function App() {
  const [score, setScore] = useState(0);
  const speed = useRef(100);
  const [fuel, setFuel] = useState(100);
  const [riverSegments, setRiverSegments] = useState([]); // Store the river segments
  const velocityRef = useRef(0); // Control smooth movement
  const animationFrame = useRef(null); // Reference to animation frame
  const [running, setRunning] = useState(true);
  const [bullets, setBullets] = useState([]); // Store bullets
  const engine = useRef(null);
  const world = useRef(null);
  const bulletSpeed = 5; // Speed at which bullets move
  const scrollY = useRef(new Animated.Value(0));
  const scrollValueRef = useRef(0);
  const [isGameRunning, setIsGameRunning] = useState(true);
  const totalHeight = useRef(undefined);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [playerPosition, setPlayerPosition] = useState({ x: screenWidth / 2, y: screenHeight * 0.8 });
  const memoizedStyles = useMemo(() => styles(screenWidth, screenHeight), [screenWidth, screenHeight]);

  const RIVER_MAX_WIDTH_RATIO = screenWidth * 0.9; // Maximum width of the river
  const RIVER_MIN_WIDTH_RATIO = AIRPLANE_WIDTH * 2; // Maximum width of the river

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
    if (!isGameRunning) return;

    if(direction === 'left') {
      velocityRef.current = -5;
    } else if(direction === 'right') {
      velocityRef.current = 5;
    } else {
      velocityRef.current = 0;
    }
    if (!animationFrame.current) moveAirplane();
  };

  const startAcc = (acc) => {
    if(acc === 'up') {
      speed.current = speed.current >= MAX_SPEED ? MAX_SPEED : speed.current + 1;
    } else if(acc === 'down') {
      speed.current = speed.current <= MIN_SPEED ? MIN_SPEED : speed.current - 1;
    }
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


  // Detect collisions && fuel consumption
  useEffect(() => {
    if (!isGameRunning) return;

    if(fuel === 0) {
      handleCollision();
    }

    // Set up a listener for scrollY updates
    const listenerId = scrollY.current.addListener(({ value }) => {
      scrollValueRef.current = value; // Update the ref with the latest scrollY value
    });

    let segmentY = totalHeight.current;
    const currentScrollY = scrollValueRef.current;

    for (let i = 0; i < riverSegments.length; i++) {
      if (segmentY - riverSegments[i].length < currentScrollY) { // Found the right segment
        const y = segmentY - currentScrollY; // Calculate the y position relative to the screen

        // Calculate the width and borders of the river at the current y
        const widthAtY = riverSegments[i].startWidth +
          (y / riverSegments[i].length) * (riverSegments[i].endWidth - riverSegments[i].startWidth);
        const leftBorder = (screenWidth - widthAtY) / 2;
        const rightBorder = leftBorder + widthAtY;

        // Check for collision
        if (playerPosition.x < leftBorder + AIRPLANE_WIDTH / 2 || playerPosition.x > rightBorder - AIRPLANE_WIDTH / 2) {
          handleCollision();
        }
        break;
      } else {
        segmentY -= riverSegments[i].length;
      }
    }

    // Clean up listener on unmount
    return () => {
      scrollY.current.removeListener(listenerId);
    };
  }, [playerPosition, scrollY, isGameRunning, riverSegments, screenWidth, handleCollision, totalHeight]);


  const handleCollision = () => {
      setIsGameRunning(false); // Stop the game

      Alert.alert(
          "You Crashed!",
          "Your airplane hit the borders. Restart the game?",
          [
              {
                  text: "Restart",
                  onPress: restartGame,
              },
              {
                  text: "Cancel",
                  style: "cancel",
              },
          ]
      );
  };

  const restartGame = () => {
    scrollY.current.setValue(totalHeight.current - screenHeight);
    setFuel(100);
    setPlayerPosition({ x: screenWidth / 2, y: entitiesRef.current.player.body.position.y });
    setIsGameRunning(true); // Restart the game
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setFuel((prevFuel) => Math.max(prevFuel - 1, 0)); // Decrease fuel by 1, but not below 0
    }, 1000); // Decrease fuel every second

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      speed.current -= Math.sign(speed.current - 100);
    }, 100); // Speed back to normal every tenth second

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

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
        const segments = riverSegmentGenerator(RIVER_MIN_WIDTH_RATIO, RIVER_MAX_WIDTH_RATIO, screenHeight / 2, screenHeight * 5, 100, 1, 2);
        totalHeight.current = segments.reduce((acc, segment) => acc + segment.length, 0);
        if (scrollY.current) {
            scrollY.current.setValue(totalHeight.current - screenHeight); // Set the scrollY value here
        }

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
          <Text style={memoizedStyles.infoText}>Speed: {speed.current}</Text>
          <Text style={memoizedStyles.infoText}>Fuel: {fuel}</Text>
        </View>

        {/* Background Area */}
        <View style={memoizedStyles.background}>
          {/* Display the scrolling background with the river segments */}
          {riverSegments.length === 0 ? (
                <Text>Loading...</Text> // Show loading indicator while fetching data
            ): (<ScrollingBackground
              width={screenWidth}
              height={screenHeight}
              riverSegments={riverSegments}
              speed={speed.current}
              scrollY={scrollY}
              totalHeight={totalHeight.current}
              isGameRunning={isGameRunning}
            />
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
            onTapMiddle={() => startMoving('still')}
            onHoldLeft={() => startMoving('left')}
            onHoldRight={() => startMoving('right')}
            onHoldMiddle={() => startMoving('still')}

            onTapUp={() => startAcc('up')}
            onTapDown={() => startAcc('down')}
            onTapNoAcc={() => startAcc('noAcc')}
            onHoldUp={() => startAcc('up')}
            onHoldDown={() => startAcc('down')}
            onHoldNoAcc={() => startAcc('noAcc')}

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
    top: 20,
    height: 20 + screenHeight * 0.05,
    backgroundColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
