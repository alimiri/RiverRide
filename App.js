import React, { useRef, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Animated, Platform, Alert } from 'react-native';
import Matter from 'matter-js';
import MovementArea from './MovementArea'; // Import the new MovementArea
import { PanResponder } from 'react-native';
import riverSegmentGenerator from './RiverSegmentGenerator'; // Import the riverSegmentGenerator
import ScrollingBackground from './ScrollingBackground';  // Import the scrolling background


const AIRPLANE_WIDTH = 50; // Width of the airplane
const SPEED_INIT = 100;
const SPEED_MAX = 1500;
const SPEED_MIN = 50;
const SPEED_INCREASE_STEP = 1;
const SPEED_BACK_TIMING = 100;

const FUEL_INIT = 100;

let initialPosition;

export default function App() {
  const [score, setScore] = useState(0);
  const speed = useRef(SPEED_INIT);
  const [fuel, setFuel] = useState(FUEL_INIT);
  const [riverSegments, setRiverSegments] = useState({ totalHeight: 0, river: [] }); // Store the river segments
  const velocityRef = useRef(0); // Control smooth movement
  const animationFrame = useRef(null); // Reference to animation frame
  const [running, setRunning] = useState(true);
  const [bullets, setBullets] = useState([]); // Store bullets
  const engine = useRef(null);
  const world = useRef(null);
  const bulletSpeed = 5; // Speed at which bullets move
  const [isGameRunning, setIsGameRunning] = useState(true);
  const leftBorder = useRef(0);
  const rightBorder = useRef(0);
  const collisionHandledRef = useRef(false);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  initialPosition = { x: screenWidth / 2, y: screenHeight * 0.8 };
  const [playerPosition, setPlayerPosition] = useState(initialPosition);
  const memoizedStyles = useMemo(() => styles(screenWidth, screenHeight), [screenWidth, screenHeight]);
  const playerPositionRef = useRef(playerPosition);

  const RIVER_MAX_WIDTH_RATIO = screenWidth * 0.9; // Maximum width of the river
  const RIVER_MIN_WIDTH_RATIO = AIRPLANE_WIDTH * 2; // Maximum width of the river

  const entitiesRef = useRef(null);  // Ref to store entities

  // Update the ref whenever playerPosition changes
  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  const moveAirplane = () => {
    setPlayerPosition((prev) => {
      if (!isGameRunning) return { x: prev.x, y: prev.y };
      const newX = prev.x + velocityRef.current;

      // Clamp position to the screen boundaries
      const clampedX = Math.max(AIRPLANE_WIDTH / 2, Math.min(screenWidth - AIRPLANE_WIDTH / 2, newX));
      if (checkForCollision(clampedX)) {
        return { x: prev.x, y: prev.y };
      } else {
        Matter.Body.setPosition(entitiesRef.current.player.body, { x: clampedX, y: prev.y });
        return { x: clampedX, y: prev.y };
      }
    });

    animationFrame.current = requestAnimationFrame(moveAirplane);
  };

  const handleShoot = () => {
    console.log('Shoot action!');
    // Add logic for shooting here
  };

  const startMoving = (direction) => {
    if (!isGameRunning) return;

    if (direction === 'left') {
      velocityRef.current = -1;
    } else if (direction === 'right') {
      velocityRef.current = 1;
    } else {
      velocityRef.current = 0;
    }
    if (!animationFrame.current) moveAirplane();
  };

  const startAcc = (acc) => {
    if (acc === 'up') {
      speed.current = speed.current >= SPEED_MAX ? SPEED_MAX : speed.current + SPEED_INCREASE_STEP;
    } else if (acc === 'down') {
      speed.current = speed.current <= SPEED_MIN ? SPEED_MIN : speed.current - SPEED_INCREASE_STEP;
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


  onScrollPositionChange = (scrollPosition) => {
    if (!isGameRunning) return;

    const bottomOfRiver = riverSegments.totalHeight - scrollPosition - screenHeight;
    const airPlaneYRelative = screenHeight - initialPosition.y + bottomOfRiver + AIRPLANE_WIDTH ;
    for (let i = 0; i < riverSegments.river.length; i++) {
      if (airPlaneYRelative < riverSegments.river[i].offset + riverSegments.river[i].length) {
        const y = airPlaneYRelative - riverSegments.river[i].offset;

        // Calculate the width and borders of the river at the current y
        const widthAtY = riverSegments.river[i].startWidth +
          (y / riverSegments.river[i].length) * (riverSegments.river[i].endWidth - riverSegments.river[i].startWidth);
        leftBorder.current = (screenWidth - widthAtY) / 2;
        rightBorder.current = leftBorder.current + widthAtY;

        //stick to the left border
        //setPlayerPosition({x: leftBorder.current + AIRPLANE_WIDTH / 2, y: initialPosition.y});
        //stick to the right border
        //setPlayerPosition({x: rightBorder.current - AIRPLANE_WIDTH / 2, y: initialPosition.y});
        //playerPositionRef.current = playerPosition;

        const currentX = playerPositionRef.current.x;
        checkForCollision(currentX);
        break;
      }
    }
  };

  const checkForCollision = (xPosition) => {
    if (!isGameRunning || collisionHandledRef.current) return true;

    if ( xPosition < leftBorder.current + AIRPLANE_WIDTH / 2 || xPosition > rightBorder.current - AIRPLANE_WIDTH / 2) {
      handleCollision();
      return true;
    }
    return false;
  };

  const handleCollision = () => {
    if (collisionHandledRef.current) return; // Ensure only one collision is handled
    collisionHandledRef.current = true; // Set flag to prevent duplicate alerts

    setIsGameRunning(false); // Stop the game

    Alert.alert(
      "You Crashed!",
      "Your airplane hit the borders. Restart the game?",
      [
        {
          text: "Restart",
          onPress: restartGame,
        }
      ]
    );
  };

  const handleFuelIsEmpty = () => {
    setIsGameRunning(false); // Stop the game

    Alert.alert(
      "You Ran Out of Fuel!",
      "Your airplane hit the borders. Restart the game?",
      [
        {
          text: "Restart",
          onPress: restartGame,
        }
      ]
    );
  };

  const restartGame = () => {
    collisionHandledRef.current = false; // Reset collision handling flag
    setIsGameRunning(true); // Restart the game
    setPlayerPosition(initialPosition); // Reset the player position
    setFuel(FUEL_INIT); // Reset fuel
    speed.current = SPEED_INIT; // Reset speed
  };

  useEffect(() => {
    if (!isGameRunning) return; // Stop the interval when the game is not running

    const interval = setInterval(() => {
      setFuel((prevFuel) => {
        const newFuel = Math.max(prevFuel - 1, 0); // Decrease fuel by 1, but not below 0
        if (newFuel === 0) {
          handleFuelIsEmpty(); // Trigger game stop when fuel reaches 0
        }
        return newFuel;
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [isGameRunning]);


  useEffect(() => {
    const interval = setInterval(() => {
      speed.current -= Math.sign(speed.current - SPEED_INIT);
    }, SPEED_BACK_TIMING); // Speed back to normal every tenth second

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
      const segments = riverSegmentGenerator(screenWidth, RIVER_MIN_WIDTH_RATIO, RIVER_MAX_WIDTH_RATIO, screenHeight / 2, screenHeight * 5, 100, 1, 2, 3, 50);
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
          {riverSegments.river.length === 0 ? (
            <Text>Loading...</Text> // Show loading indicator while fetching data
          ) : (<ScrollingBackground
            width={screenWidth}
            height={screenHeight}
            riverSegments={riverSegments}
            speed={speed.current}
            isGameRunning={isGameRunning}
            onScrollPositionChange={onScrollPositionChange}
          />
          )}

          {/* Airplane */}
          <Image
            source={require('./assets/airplane.png')} // Replace with your airplane image
            style={[memoizedStyles.airplane, { left: playerPosition.x - AIRPLANE_WIDTH / 2 }]}
          />

          {/* Render river segments */}
          {riverSegments.river.map((segment, index) => (
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
