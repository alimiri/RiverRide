import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, Dimensions, Image, Alert } from 'react-native';
import Matter from 'matter-js';
import MovementArea from './MovementArea'; // Import the new MovementArea
import riverSegmentGenerator from './RiverSegmentGenerator'; // Import the riverSegmentGenerator
import ScrollingBackground from './ScrollingBackground';  // Import the scrolling background
import ShootButton from './ShootButton';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';


const AIRPLANE_WIDTH = 50; // Width of the airplane
const AIRPLANE_HEIGHT = 50; // Height of the airplane
const SPEED_INIT = 500;
const SPEED_MAX = 1500;
const SPEED_MIN = 50;
const SPEED_INCREASE_STEP = 1;
const SPEED_BACK_TIMING = 100;

const FUEL_INIT = 100;

const BULLET_SPEED = 5;
const BULLET_WIDTH = 2;
const BULLET_HEIGHT = 3;

let initialPosition = { x: 0, y: 0 };

export default function App() {
  const [score, setScore] = useState(0);
  const speed = useRef(SPEED_INIT);
  const [fuel, setFuel] = useState(FUEL_INIT);
  const [riverSegments, setRiverSegments] = useState({ totalHeight: 0, river: [] }); // Store the river segments
  const animationFrame = useRef(null); // Reference to animation frame
  const [bullets, setBullets] = useState([]);
  const engine = useRef(null);
  const world = useRef(null);
  const [scrollingViewDimensions, setScrollingViewDimensions] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [movementViewDimensions, setMovementViewDimensions] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isGameRunning, setIsGameRunning] = useState(false);
  const leftBorder = useRef(0);
  const rightBorder = useRef(0);
  const endGameHandleRef = useRef(false);
  const [resetFlag, setResetFlag] = useState(false);
  const [resetRiver, setResetRiver] = useState(false);
  const explosions = useRef([]);
  const [explosionSound, setExplosionSound] = useState(null);
  const isAirplaneVisible = useRef(true);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const playerPosition = useRef(initialPosition);
  const [airplaneYRelative, setAirplaneYRelative] = useState(0);
  const bottomOfTheRiverRef = useRef(0);
  const memoizedStyles = useMemo(() => styles(screenWidth, screenHeight), [screenWidth, screenHeight]);

  const RIVER_MAX_WIDTH_RATIO = screenWidth * 0.9; // Maximum width of the river
  const RIVER_MIN_WIDTH_RATIO = AIRPLANE_WIDTH * 2; // Maximum width of the river

  const entitiesRef = useRef(null);  // Ref to store entities

  const handleScrollingBackgroundDimensionsChange = (layout) => {
    setScrollingViewDimensions(layout);
    initialPosition = { x: screenWidth / 2, y: movementViewDimensions.y - layout.y - 50 - AIRPLANE_HEIGHT / 2 };
    playerPosition.current = initialPosition;
  };

  const handleMovementAreaDimensionsChange = (layout) => {
    setMovementViewDimensions(layout);
    initialPosition = { x: screenWidth / 2, y: layout.y - scrollingViewDimensions.y - 50 - AIRPLANE_HEIGHT / 2 };
    playerPosition.current = initialPosition;
  };

  const moveAirplane = (direction) => {
    const prev = playerPosition.current;

    if (!isGameRunning) {
      return;
    }
    let newX = prev.x;
    if (direction === 'left') {
      newX--;
    } else if (direction === 'right') {
      newX++;
    }
    if (!checkForCollision(newX)) {
      Matter.Body.setPosition(entitiesRef.current.player.body, { x: newX, y: prev.y });
      playerPosition.current = { x: newX, y: prev.y };
    }
  };

  const Explosion = ({ x, y }) => {
    return (
      <LottieView
        source={require('./assets/explosion.json')}
        autoPlay
        loop={false}
        style={{
          position: 'absolute',
          width: 100,
          height: 100,
          left: x - 50, // Center the explosion
          top: y - 50,
        }}
      />
    );
  };

  // sound system
  const soundRef = useRef(null); // Reference for sound instance

  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    }
  };

  const startSound = (effect) => {
    const loadSound = async () => {
      let soundEffect = null;
      let params = null;
      if(effect === 'airplane') {
        soundEffect = require('./assets/airplane-engine.mp3');
        params = { shouldPlay: true, isLooping: true };
      } else {
        soundEffect = require('./assets/explosion.mp3');
        params = { shouldPlay: true, isLooping: false };
      }
      const { sound } = await Audio.Sound.createAsync(soundEffect, params);
      soundRef.current = sound;
    };

    loadSound();
  };

  const handleShoot = () => {
    if (!isGameRunning) {
      restartGame();
      setIsGameRunning(true);
      startSound('airplane');
    }

    if (!world.current) {
      console.error('Matter.js world is not defined!');
      return;
    }
    // Create the bullet
    const bullet = Matter.Bodies.rectangle(
      playerPosition.current.x,
      playerPosition.current.y - AIRPLANE_HEIGHT / 2,
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

  const startAcc = (acc) => {
    if (acc === 'up') {
      speed.current = speed.current >= SPEED_MAX ? SPEED_MAX : speed.current + SPEED_INCREASE_STEP;
    } else if (acc === 'down') {
      speed.current = speed.current <= SPEED_MIN ? SPEED_MIN : speed.current - SPEED_INCREASE_STEP;
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
    if (!isGameRunning || playerPosition.current.x === 0) return;

    // check for border collision
    bottomOfTheRiverRef.current = riverSegments.totalHeight - scrollPosition - screenHeight + movementViewDimensions.height + scrollingViewDimensions.y;
    const airplaneYRelative = bottomOfTheRiverRef.current + 50 + AIRPLANE_HEIGHT;
    setAirplaneYRelative(airplaneYRelative);
    for (let i = 0; i < riverSegments.river.length; i++) {
      const segment = riverSegments.river[i];
      if (airplaneYRelative < segment.offset + segment.length) {
        const y = airplaneYRelative - segment.offset;

        // Calculate the width and borders of the river at the current y
        const widthAtY = segment.startWidth + (y / segment.length) * (segment.endWidth - segment.startWidth);
        leftBorder.current = (screenWidth - widthAtY) / 2;
        rightBorder.current = leftBorder.current + widthAtY;

        //stick to the left border
        //playerPosition.current = {x: leftBorder.current + AIRPLANE_WIDTH / 2, y: initialPosition.y};
        //stick to the right border
        //playerPosition.current = {x: rightBorder.current - AIRPLANE_WIDTH / 2, y: initialPosition.y};

        checkForCollision(playerPosition.current.x);

        //check bridge collision
        const bridge = segment.bridges.find(bridge => {
          if (airplaneYRelative >= bridge.points[0][0].y + segment.offset) {
            stopSound();
            startSound('explosion');
            addExplosion(playerPosition.current.x, playerPosition.current.y, bottomOfTheRiverRef.current);
            isAirplaneVisible.current = false;
            return true;
          }
        });
        if (bridge) {
          handleEndGame('bridge');
          return true;
        }

        break;
      }
    }
  };

  const addExplosion = (x, y, refPosition) => {
      explosions.current.push({ x, y, refPosition });
      setTimeout(() => {
        explosions.current.splice(0, 1);
      }, 3000);
  };

  const checkForCollision = (xPosition) => {
    if (!isGameRunning || endGameHandleRef.current) return true;

    if (xPosition < leftBorder.current + AIRPLANE_WIDTH / 2 || xPosition > rightBorder.current - AIRPLANE_WIDTH / 2) {
      handleEndGame('border');

      isAirplaneVisible.current = false;
      stopSound();
      startSound('explosion');
      addExplosion(playerPosition.current.x, playerPosition.current.y, bottomOfTheRiverRef.current);

      return true;
    }

    return false;
  };

  const handleEndGame = (barrier) => {
    if (endGameHandleRef.current) return; // Ensure only one collision is handled
    endGameHandleRef.current = true; // Set flag to prevent duplicate alerts

    setIsGameRunning(false); // Stop the game

    const message = barrier === 'fuel' ? "You ran out of fuel!" : `You hit the ${barrier}!`;
    Alert.alert(
      `You Crashed!`,
      `${message}. Restart the game?`,
      [
        {
          text: "Restart",
          onPress: restartGame,
        }
      ]
    );
  };

  const restartGame = () => {
    endGameHandleRef.current = false; // Reset collision handling flag
    playerPosition.current = initialPosition; // Reset the player position
    setFuel(FUEL_INIT); // Reset fuel
    speed.current = SPEED_INIT; // Reset speed
    setResetFlag((prev) => !prev);
    isAirplaneVisible.current = true;
  };

  useEffect(() => {
    if (!isGameRunning) return;

    const interval = setInterval(() => {
      setFuel((prevFuel) => {
        const newFuel = Math.max(prevFuel - 1, 0); // Decrease fuel by 1, but not below 0
        if (newFuel === 0) {
          handleEndGame('fuel');
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
  const bulletMovementIntervalRef = useRef(null);
  useEffect(() => {
    if (isGameRunning) {
      bulletMovementIntervalRef.current = setInterval(() => {
        if (entitiesRef.current) {
          setBullets((prevBullets) => {
            const newBullets = prevBullets
              .map((bullet) => {
                Matter.Body.translate(bullet, { x: 0, y: -BULLET_SPEED });
                return bullet;
              })
              .filter((bullet) => {
                //check for bullet to the bridge collision
                const bulletYRelative = bottomOfTheRiverRef.current + 50 + AIRPLANE_HEIGHT + playerPosition.current.y - AIRPLANE_HEIGHT / 2 - bullet.position.y;
                for (let i = 0; i < riverSegments.river.length; i++) {
                  const segment = riverSegments.river[i];
                  if (bulletYRelative < segment.offset + segment.length) {
                    const bridgeIndex = segment.bridges.findIndex(bridge => {
                      if (bulletYRelative >= bridge.points[0][0].y + segment.offset) {
                        //stopSound();
                        startSound('explosion');
                        addExplosion(bridge.points[5][0].x + (bridge.points[5][1].x - bridge.points[5][0].x) / 4 , bridge.points[5][0].y + segment.offset - bottomOfTheRiverRef.current, bottomOfTheRiverRef.current);
                        addExplosion(bridge.points[5][0].x + (bridge.points[5][1].x - bridge.points[5][0].x) * 3 / 4 , bridge.points[5][0].y + segment.offset - bottomOfTheRiverRef.current, bottomOfTheRiverRef.current);
                        return true;
                      }
                    });
                    if (bridgeIndex >= 0) {
                      segment.bridges.splice(bridgeIndex, 1);
                      setResetRiver((prev) => !prev);
                      return false;
                    }
                    break;
                  }
                }
                return bullet.position.y > 0
              }); // Remove bullets that move off screen
            return newBullets;
          });
        }
      }, 1000 / 60); // Update every frame
    } else if (bulletMovementIntervalRef.current) {
      clearInterval(bulletMovementIntervalRef.current);
      bulletMovementIntervalRef.current = null;
    }
    return () => {
      if (bulletMovementIntervalRef.current) {
        clearInterval(bulletMovementIntervalRef.current);
        bulletMovementIntervalRef.current = null;
      }
    }
  }, [isGameRunning]);

  // Function to generate and update river segments
  useEffect(() => {
    const generateRiver = () => {
      const segments = riverSegmentGenerator(screenWidth, RIVER_MIN_WIDTH_RATIO, RIVER_MAX_WIDTH_RATIO, screenHeight / 2, screenHeight * 5, 100, 50, { seedW: 1, seedH: 2, seedTree: 3, seedBridge: 1, seedHelicopter: 10 });
      setRiverSegments(segments);
    };

    generateRiver();
  }, [screenWidth, screenHeight]);

  useRef(setupWorld()).current;

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <View style={memoizedStyles.container}>
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
            onDimensionsChange={handleScrollingBackgroundDimensionsChange}
            resetFlag={resetFlag}
            resetRiver={resetRiver}
          />
          )}
          {isAirplaneVisible.current && (
            <Image
              source={require('./assets/airplane.png')}
              style={[
                memoizedStyles.airplane,
                {
                  left: playerPosition.current.x - AIRPLANE_WIDTH / 2,
                  top: playerPosition.current.y - AIRPLANE_HEIGHT / 2,
                },
              ]}
            />
          )}

          {bullets.map((bullet, index) => {
            return (<View
              key={index}
              style={{
                position: 'absolute',
                left: bullet.position.x,
                top: bullet.position.y,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
                backgroundColor: 'red',
              }}
            />
            );
          })}
          {explosions.current.map((explosion, index) => (
            <Explosion key={index} x={explosion.x} y={explosion.y - explosion.refPosition + bottomOfTheRiverRef.current} />
          ))}
        </View>

        <View style={memoizedStyles.controlsStrip}>
          <ShootButton onShoot={handleShoot} isGameRunning={isGameRunning} />

          {/* Right: Movement Area */}
          <MovementArea
            onMoveAcc={(dir) => ['left', 'right', 'still'].includes(dir) ? moveAirplane(dir) : startAcc(dir)}
            onDimensionsChange={handleMovementAreaDimensionsChange}
            isGameRunning={isGameRunning}
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
    width: AIRPLANE_WIDTH,
    height: AIRPLANE_WIDTH,
  },

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
