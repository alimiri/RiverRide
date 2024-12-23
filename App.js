import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, Dimensions, Image, Alert, TouchableWithoutFeedbackBase } from 'react-native';
import Matter from 'matter-js';
import MovementArea from './MovementArea'; // Import the new MovementArea
import riverSegmentGenerator from './RiverSegmentGenerator'; // Import the riverSegmentGenerator
import ScrollingBackground from './ScrollingBackground';  // Import the scrolling background
import ShootButton from './ShootButton';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import Svg, { Polygon } from 'react-native-svg';

import airplaneImage from './assets/airplane.png';
import helicopterLtrImage from './assets/helicopter-ltr.png';
import helicopterRtlImage from './assets/helicopter-rtl.png';
import treeImage from './assets/tree.png';

const AIRPLANE_SIZE = { width: 50, height: 50 };
const SPEED_INIT = 50;
const SPEED_MAX = 100;
const SPEED_MIN = 20;
const SPEED_INCREASE_STEP = 5;
const SPEED_BACK_TIMING = 100;

const FUEL_INIT = 100;

const BULLET_SPEED = 5;
const BULLET_SIZE = { width: 2, height: 3 };

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
  const isGameRunning = useRef(false);
  const leftBorder = useRef(0);
  const rightBorder = useRef(0);
  const endGameHandleRef = useRef(false);
  const [resetFlag, setResetFlag] = useState(false);
  const explosions = useRef([]);
  const [explosionSound, setExplosionSound] = useState(null);
  const isAirplaneVisible = useRef(true);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const initialPosition = useRef({ x: 0, y: 0 });
  const playerPosition = useRef(initialPosition.current);
  const airplaneYRelative = useRef(0);
  const bottomOfTheRiverRef = useRef(0);
  const memoizedStyles = useMemo(() => styles(screenWidth, screenHeight), [screenWidth, screenHeight]);

  const RIVER_MAX_WIDTH_RATIO = screenWidth * 0.9; // Maximum width of the river
  const RIVER_MIN_WIDTH_RATIO = AIRPLANE_SIZE.width * 2; // Maximum width of the river

  const entitiesRef = useRef(null);  // Ref to store entities

  const objects = {
    tree: {
      seed: 3,
      size: { width: 50, height: 50 },
      movement: 'still',
      image: {still: treeImage},
      minNumber: 5,
      maxNumber: 10,
    },
    helicopter: {
      seed: 10,
      size: { width: 50, height: 50 },
      movement: 'shuttle',
      image: {ltr: helicopterLtrImage, rtl: helicopterRtlImage},
      minNumber: 1,
      maxNumber: 4,
    }
  };

  const handleScrollingBackgroundDimensionsChange = (layout) => {
    setScrollingViewDimensions(layout);
    initialPosition.current = { x: screenWidth / 2, y: movementViewDimensions.y - layout.y - 50 - AIRPLANE_SIZE.height / 2 };
    playerPosition.current = initialPosition.current;
  };

  const handleMovementAreaDimensionsChange = (layout) => {
    setMovementViewDimensions(layout);
    initialPosition.current = { x: screenWidth / 2, y: layout.y - scrollingViewDimensions.y - 50 - AIRPLANE_SIZE.height / 2 };
    playerPosition.current = initialPosition.current;
  };

  const moveAirplane = (direction) => {
    const prev = playerPosition.current;

    if (!isGameRunning.current) {
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
        source={require('./assets/explosion2.json')}
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
      if (effect === 'airplane') {
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
    if (!isGameRunning.current) {
      restartGame();
      isGameRunning.current = true;
      startSound('airplane');
      return;
    }

    if (!world.current) {
      console.error('Matter.js world is not defined!');
      return;
    }
    // Create the bullet
    const bullet = Matter.Bodies.rectangle(
      playerPosition.current.x,
      playerPosition.current.y - AIRPLANE_SIZE.height / 2,
      BULLET_SIZE.width,
      BULLET_SIZE.height,
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
      player: { body: player, size: [50, 50], color: "blue" },
      screenWidth,
      screenHeight,
    };

    return entitiesRef.current;
  };

  onScrollPositionChange = (scrollPosition) => {
    bottomOfTheRiverRef.current = scrollingViewDimensions.height ? riverSegments.totalHeight - scrollingViewDimensions.height - scrollPosition : 0;
    airplaneYRelative.current = bottomOfTheRiverRef.current + 50 + AIRPLANE_SIZE.height / 2;
    segmentsInRange().forEach(segment => {
      if (airplaneYRelative.current >= segment.offset && airplaneYRelative.current <= segment.offset + segment.length) {
        const y = airplaneYRelative.current - segment.offset;

        // Calculate the width and borders of the river at the current y
        const widthAtY = segment.startWidth + (y / segment.length) * (segment.endWidth - segment.startWidth);
        leftBorder.current = (screenWidth - widthAtY) / 2;
        rightBorder.current = leftBorder.current + widthAtY;

        // check for border collision
        checkForCollision(playerPosition.current.x);

        //stick to the left border
        //playerPosition.current = {x: leftBorder.current + AIRPLANE_SIZE.width / 2, y: initialPosition.current.y};
        //stick to the right border
        //playerPosition.current = {x: rightBorder.current - AIRPLANE_SIZE.width / 2, y: initialPosition.current.y};
      }

      //check bridge collision
      const bridge = segment.objects.find(object => {
      if (object.type === 'bridge' && !object.destroyed && airplaneYRelative.current >= object.points[0][0].y + segment.offset) {
        stopSound();
        startSound('explosion');
        addExplosion(playerPosition.current.x, playerPosition.current.y, bottomOfTheRiverRef.current);
        isAirplaneVisible.current = false;
        return true;
      }
      });
      if (!isGameRunning.current || playerPosition.current.x === 0) return;
      if (bridge) {
        handleEndGame('bridge');
        return true;
      }
      //check helicopter collision
      const object = segment.objects.filter(_ => _.type === 'helicopter').find(object => {
        if (object.destroyed) {
          return false;
        }
        let yCollide = false;
        let xCollide = false;
        if(airplaneYRelative.current + AIRPLANE_SIZE.height / 2 >= object.y + segment.offset - objects[object.type].size.height / 2 && airplaneYRelative.current - AIRPLANE_SIZE.height / 2 <= object.y + segment.offset + objects[object.type].size.height / 2) {
          yCollide = true;
        }
        if(yCollide) {
          if(playerPosition.current.x + AIRPLANE_SIZE.width / 2 >= object.x - objects[object.type].size.width / 2 && playerPosition.current.x - AIRPLANE_SIZE.width / 2 <= object.x + objects[object.type].size.width / 2) {
            xCollide = true;
          }
        }
        return yCollide && xCollide;
      });
      if (object) {
        stopSound();
        startSound('explosion');
        addExplosion(playerPosition.current.x, playerPosition.current.y, bottomOfTheRiverRef.current);
        addExplosion(object.x, mapY(object.y + segment.offset), bottomOfTheRiverRef.current);
        isAirplaneVisible.current = false;
        object.destroyed = true;
        handleEndGame(object.type);
        return true;
      }

    });
  };

  const addExplosion = (x, y, refPosition) => {
    explosions.current.push({ x, y, refPosition });
    setTimeout(() => {
      explosions.current.splice(0, 1);
    }, 1000);
  };

  const checkForCollision = (xPosition) => {
    if (!isGameRunning.current || endGameHandleRef.current) return true;

    if (xPosition < leftBorder.current + AIRPLANE_SIZE.width / 2 || xPosition > rightBorder.current - AIRPLANE_SIZE.width / 2) {
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

    isGameRunning.current = false; // Stop the game

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
    playerPosition.current = initialPosition.current; // Reset the player position
    setFuel(FUEL_INIT); // Reset fuel
    speed.current = SPEED_INIT; // Reset speed
    setResetFlag((prev) => !prev);
    isAirplaneVisible.current = true;
    bottomOfTheRiverRef.current = 0;
    //restore bridges and helicopters
    riverSegments.river.forEach(segment => {
      segment.objects.forEach(object => {object.destroyed = false;});
    });
    setBullets(() => []);
  };

  useEffect(() => {
    if (!isGameRunning.current) return;

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
  }, [isGameRunning.current]);


  useEffect(() => {
    const interval = setInterval(() => {
      speed.current -= Math.sign(speed.current - SPEED_INIT);
    }, SPEED_BACK_TIMING); // Speed back to normal every tenth second

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  // Handle bullet movement
  const bulletMovementIntervalRef = useRef(null);
  useEffect(() => {
    if (isGameRunning.current) {
      bulletMovementIntervalRef.current = setInterval(() => {
        if (entitiesRef.current) {
          setBullets((prevBullets) => {
            const newBullets = prevBullets
              .map((bullet) => {
                Matter.Body.translate(bullet, { x: 0, y: -BULLET_SPEED });
                return bullet;
              })
              .filter((bullet) => {
                const bulletYRelative = bottomOfTheRiverRef.current + 50 + AIRPLANE_SIZE.height + playerPosition.current.y - AIRPLANE_SIZE.height / 2 - bullet.position.y;
                let found = false;
                segmentsInRange().forEach(segment => {
                //check for bullet to the bridge collision
                  const bridge = segment.objects.find(bridge => {
                    if (bridge.type === 'bridge' && !bridge.destroyed && bulletYRelative >= bridge.points[0][0].y + segment.offset) {
                      //stopSound();
                      startSound('explosion');
                      addExplosion(bridge.points[5][0].x + (bridge.points[5][1].x - bridge.points[5][0].x) / 4, mapY(bridge.points[5][0].y + segment.offset), bottomOfTheRiverRef.current);
                      addExplosion(bridge.points[5][0].x + (bridge.points[5][1].x - bridge.points[5][0].x) * 3 / 4, mapY(bridge.points[5][0].y + segment.offset), bottomOfTheRiverRef.current);
                      return true;
                    }
                  });
                  if (bridge) {
                    bridge.destroyed = true;
                    found = true;
                  }

                  //check for bullet to the helicopter collision
                  const helicopter = segment.objects.find(helicopter =>
                        helicopter.type === 'helicopter' && !helicopter.destroyed &&
                        bulletYRelative >= helicopter.y - objects['helicopter'].size.height / 2 + segment.offset &&
                        bulletYRelative <= helicopter.y + objects['helicopter'].size.height / 2 + segment.offset &&
                        bullet.position.x >= helicopter.x - objects['helicopter'].size.width / 2 &&
                        bullet.position.x <= helicopter.x + objects['helicopter'].size.width / 2);
                  if (helicopter) {
                      startSound('explosion');
                      addExplosion(bullet.position.x, bullet.position.y, bottomOfTheRiverRef.current);
                      helicopter.destroyed = true;
                      found = true;
                  }
                });

                return !found && bullet.position.y > 0
              }); // Remove bullets that move off screen
            return newBullets;
          });

          // helicopter movement
          segmentsInRange().forEach(segment => {
            segment.objects.filter(_ => _.type === 'helicopter').forEach(helicopter => {
              const widthAtY = segment.startWidth + (helicopter.y / segment.length) * (segment.endWidth - segment.startWidth);
              const leftBorder = (screenWidth - widthAtY) / 2;
              const rightBorder = leftBorder + widthAtY;

              if (helicopter.direction === 'ltr') {
                helicopter.x += 1;
                if (helicopter.x + objects['helicopter'].size.width >= rightBorder) {
                  helicopter.direction = 'rtl';
                }
              } else {
                helicopter.x -= 1;
                if (helicopter.x <= leftBorder) {
                  helicopter.direction = 'ltr';
                }
              }
            });
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
  }, [isGameRunning.current]);

  const initSegments = () => {
    const segments = riverSegmentGenerator(screenWidth, RIVER_MIN_WIDTH_RATIO, RIVER_MAX_WIDTH_RATIO, screenHeight / 2, screenHeight * 5, 100, { seedW: 1, seedH: 2, seedBridge: 1 }, objects);
    setRiverSegments(segments);
  };

  useEffect(() => {
    const generateRiver = () => {
      initSegments();
    };

    generateRiver();
  }, [screenWidth, screenHeight]);

  useRef(setupWorld()).current;

  const segmentsInRange = () => riverSegments.river.filter(segment => segment.offset + segment.length >= bottomOfTheRiverRef.current && segment.offset <= bottomOfTheRiverRef.current + movementViewDimensions.y - scrollingViewDimensions.y);

  const mapY = y => movementViewDimensions.y - scrollingViewDimensions.y - (y - bottomOfTheRiverRef.current);

  const renderBridges = () => {
    const SECTION_COLORS = ["navy", "darkgreen"];
    return (
      <Svg key={`bridges`} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: movementViewDimensions.y - scrollingViewDimensions.y, }}>
        {segmentsInRange().reduce((bridges, segment, segmentIndex) => {
          segment.objects.filter(_ => ['bridge'].includes(_.type)  && !_.destroyed).forEach((bridge, bridgeIndex) => {
            const n = bridge.points.length;
            for (let i = 0; i < n; i++) {
              const polygonPoints = bridge.points[i].map((p) => `${p.x},${mapY(p.y + segment.offset)}`).join(' ');
              const fillColor =
                i === 0 || i === n - 1
                  ? "brown" // Top and bottom sections are brown
                  : SECTION_COLORS[(i - 1) % SECTION_COLORS.length]; // Alternate green colors for middle sections
              bridges.push(
                <Polygon
                  key={`bridge-${segmentIndex}-${bridgeIndex}-${i}`}
                  points={polygonPoints}
                  fill={fillColor}
                />);
            }
          });
          return bridges;
        }, [])}
      </Svg>);
  };
  const renderObjects = () =>
    segmentsInRange().
      map((segment, segmentIndex) => {
        return segment.objects.filter(_ => ['helicopter', 'tree'].includes(_.type)  && !_.destroyed).map((object, objectIndex) => {
          return (
            <Image
              key={`${object.type}-${segmentIndex}-${objectIndex}`}
              source={objects[object.type].image[object.direction??objects[object.type].movement]}
              style={{
                position: 'absolute',
                width: objects[object.type].size.width,
                height: objects[object.type].size.height,
                left: object.x,
                top: mapY(object.y + segment.offset),
              }}
            />
          );
        })}
      );

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <View style={memoizedStyles.container}>
        <View style={memoizedStyles.infoStrip}>
          <Text style={memoizedStyles.infoText}>Score: {airplaneYRelative.current}</Text>
          <Text style={memoizedStyles.infoText}>Speed: {bottomOfTheRiverRef.current}</Text>
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
            isGameRunning={isGameRunning.current}
            onScrollPositionChange={onScrollPositionChange}
            onDimensionsChange={handleScrollingBackgroundDimensionsChange}
            resetFlag={resetFlag}
          />
          )}
          {renderBridges()}
          {/* airplane */}
          {isAirplaneVisible.current && (
            <Image
              source={airplaneImage}
              style={[
                memoizedStyles.airplane,
                {
                  left: playerPosition.current.x - AIRPLANE_SIZE.width / 2,
                  top: playerPosition.current.y - AIRPLANE_SIZE.height / 2,
                },
              ]}
            />
          )}
          {/* bullets */}
          {bullets.map((bullet, index) => {
            return (<View
              key={index}
              style={{
                position: 'absolute',
                left: bullet.position.x,
                top: bullet.position.y,
                width: BULLET_SIZE.width,
                height: BULLET_SIZE.height,
                backgroundColor: 'red',
              }}
            />
            );
          })}
          {/* trees and helicopters */}
          {renderObjects()}
          {/* explosions */}
          {explosions.current.map((explosion, index) => (
            <Explosion key={index} x={explosion.x} y={explosion.y - explosion.refPosition + bottomOfTheRiverRef.current} />
          ))}
        </View>

        <View style={memoizedStyles.controlsStrip}>
          <ShootButton onShoot={handleShoot} isGameRunning={isGameRunning.current} />

          {/* Right: Movement Area */}
          <MovementArea
            onMoveAcc={(dir) => moveAirplane(dir)}
            onChangeAcc={(dir) => startAcc(dir)}
            onDimensionsChange={handleMovementAreaDimensionsChange}
            isGameRunning={isGameRunning.current}
          />
        </View>
      </View>
    </View>
  );
}

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
    width: AIRPLANE_SIZE.width,
    height: AIRPLANE_SIZE.width,
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
