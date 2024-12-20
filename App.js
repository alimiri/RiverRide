import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, Dimensions, Image, Alert } from 'react-native';
import Matter from 'matter-js';
import MovementArea from './MovementArea'; // Import the new MovementArea
import riverSegmentGenerator from './RiverSegmentGenerator'; // Import the riverSegmentGenerator
import ScrollingBackground from './ScrollingBackground';  // Import the scrolling background
import ShootButton from './ShootButton';


const AIRPLANE_WIDTH = 50; // Width of the airplane
const SPEED_INIT = 1000;
const SPEED_MAX = 1500;
const SPEED_MIN = 50;
const SPEED_INCREASE_STEP = 1;
const SPEED_BACK_TIMING = 100;

const FUEL_INIT = 100;

const BULLET_SPEED = 5;
const BULLET_WIDTH = 2;
const BULLET_HEIGHT = 3;

let initialPosition;

export default function App() {
  const [score, setScore] = useState(0);
  const speed = useRef(SPEED_INIT);
  const [fuel, setFuel] = useState(FUEL_INIT);
  const [riverSegments, setRiverSegments] = useState({ totalHeight: 0, river: [] }); // Store the river segments
  const velocityRef = useRef(0); // Control smooth movement
  const animationFrame = useRef(null); // Reference to animation frame
  const [bullets, setBullets] = useState([]);
  const engine = useRef(null);
  const world = useRef(null);

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
    if (!world.current) {
      console.error('Matter.js world is not defined!');
      return;
    }
    // Create the bullet
    const bullet = Matter.Bodies.rectangle(
      playerPositionRef.current.x,
      playerPositionRef.current.y,
      BULLET_WIDTH,
      BULLET_HEIGHT,
      {
        isStatic: false,
        render: { fillStyle: 'red' },
      }
    );

    // Try adding the bullet to the Matter.js world
    try {
      Matter.World.add(world.current, [bullet]);
    } catch (error) {
      console.error('Error adding bullet to Matter.js world:', error);
    }

    // Update the bullets state
    setBullets((prevBullets) => [...prevBullets, bullet]);
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
    engine.current = Matter.Engine.create();
    world.current = engine.current.world;

    engine.current.gravity.y = 0;

    const playerX = screenWidth / 2;
    const playerY = screenHeight * 0.8;

    // Create player airplane body
    const player = Matter.Bodies.rectangle(playerX, playerY, 50, 50);
    Matter.World.add(world.current, [player]);

    entitiesRef.current = {
      physics: { engine: engine.current, world: world.current },
      player: { body: player, size: [50, 50], color: "blue", renderer: AirplaneImage },
      screenWidth,
      screenHeight,
    };

    return entitiesRef.current;
  };

  onScrollPositionChange = (scrollPosition) => {
    if (!isGameRunning) return;

    // check for border collision
    const bottomOfRiver = riverSegments.totalHeight - scrollPosition - screenHeight;
    const airPlaneYRelative = screenHeight - initialPosition.y + bottomOfRiver - AIRPLANE_WIDTH;
    for (let i = 0; i < riverSegments.river.length; i++) {
      const segment = riverSegments.river[i];
      if (airPlaneYRelative < segment.offset + segment.length) {
        const y = airPlaneYRelative - segment.offset;

        // Calculate the width and borders of the river at the current y
        const widthAtY = segment.startWidth + (y / segment.length) * (segment.endWidth - segment.startWidth);
        leftBorder.current = (screenWidth - widthAtY) / 2;
        rightBorder.current = leftBorder.current + widthAtY;

        //stick to the left border
        //setPlayerPosition({x: leftBorder.current + AIRPLANE_WIDTH / 2, y: initialPosition.y});
        //stick to the right border
        //setPlayerPosition({x: rightBorder.current - AIRPLANE_WIDTH / 2, y: initialPosition.y});
        //playerPositionRef.current = playerPosition;

        checkForCollision(playerPositionRef.current.x);

        //check bridge collision
        const bridge = segment.bridges.find(bridge => {
          if(airPlaneYRelative + 218 >= bridge.points[0].y + segment.offset) {
            console.log(airPlaneYRelative, bridge.points[0].y + segment.offset);
            console.log(`bridge: ${bridge.points[0].x} ${bridge.points[0].y} ${bridge.points[1].x} ${bridge.points[1].y} ${bridge.points[2].x} ${bridge.points[2].y} ${bridge.points[3].x} ${bridge.points[3].y}`);
            return true;
          }
        });
        if(bridge) {
          handleCollision();
          return true;
      }

        break;
      }
    }
  };

  const checkForCollision = (xPosition) => {
    if (!isGameRunning || collisionHandledRef.current) return true;

    if (xPosition < leftBorder.current + AIRPLANE_WIDTH / 2 || xPosition > rightBorder.current - AIRPLANE_WIDTH / 2) {
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
              Matter.Body.translate(bullet, { x: 0, y: -BULLET_SPEED });
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
      const segments = riverSegmentGenerator(screenWidth, RIVER_MIN_WIDTH_RATIO, RIVER_MAX_WIDTH_RATIO, screenHeight / 2, screenHeight * 5, 100, 50, {seedW: 1, seedH: 2, seedTree: 3, seedBridge: 1, seedHelicopter: 10});
      setRiverSegments(segments);
    };

    generateRiver();
  }, [screenWidth, screenHeight]);

  useRef(setupWorld()).current;

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
          <Image
            source={require('./assets/airplane.png')}
            style={[memoizedStyles.airplane, { left: playerPosition.x - AIRPLANE_WIDTH / 2 }]}
          />
          {bullets.map((bullet, index) => {
            return (<View
              key={index}
              style={{
                position: 'absolute',
                left: bullet.position.x,
                top: bullet.position.y - 150,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
                backgroundColor: 'red',
              }}
            />
            );
          })}
        </View>

        {/* Bottom Controls Strip */}
        <View style={memoizedStyles.controlsStrip}>
          <ShootButton onShoot={handleShoot} />

          {/* Right: Movement Area */}
          <MovementArea
            onTap={(dir) => ['left', 'right', 'still'].includes(dir) ? startMoving(dir) : startAcc(dir)}
            onHold={(dir) => ['left', 'right', 'still'].includes(dir) ? startMoving(dir) : startAcc(dir)}
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
