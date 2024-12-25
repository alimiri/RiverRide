class SeededRandom {
    constructor(seed) {
        this.seed = seed;
        this.x = Math.sin(this.seed) * 10000; // Initialize with the seed
    }

    next() {
        this.x = Math.sin(this.x) * 10000;
        return this.x - Math.floor(this.x); // Return fractional part for randomness
    }
}

export default function generateRiverSegments(
    screenWidth,
    minWidth,
    maxWidth,
    minLength,
    maxLength,
    numSegments,
    seeds,
    objects,
) {
    const {seedW, seedH, seedBridge, seedHelicopter} = seeds;
    const randomW = new SeededRandom(seedW); // Seeded RNG for width
    const randomH = new SeededRandom(seedH); // Seeded RNG for length


    let segments = [];
    let startWidth = maxWidth;
    let endWidth;
    let offset = 0;

    for (let i = 0; i < numSegments; i++) {
        // Determine segment length
        let length = minLength + Math.floor((maxLength - minLength) * randomH.next());

        // Determine river widths
        if (i === 0) {
            startWidth = Math.floor(randomW.next() * (maxWidth - minWidth + 1)) + minWidth;
            endWidth = startWidth;
        } else if (segments[i - 1].endWidth !== segments[i - 1].startWidth) {
            startWidth = segments[i - 1].endWidth;
            endWidth = startWidth;
        } else {
            const r = randomW.next();
            if (r > 0.45 && r < 0.55) {
                // Sharp change in width
                startWidth = Math.floor(randomW.next() * (maxWidth - minWidth + 1)) + minWidth;
                endWidth = startWidth;
            } else {
                startWidth = segments[i - 1].endWidth;
                endWidth = Math.floor(randomW.next() * (maxWidth - minWidth + 1)) + minWidth;
                length = minLength;
            }
        }

        const _objects = [];
        //generate briges
        if(true) {
            const bridge = {type: 'bridge', points: []};
            const y1 = length / 2 - 50;
            const y2 = length / 2 + 50;
            const yIncrement = (y2 - y1) / 10;
            bridge.y = (y1 + y2) / 2;
            bridge.height = y2 - y1;
            bridge.x = screenWidth / 2;
            bridge.width = startWidth + (endWidth - startWidth) * y1 / length;

            for(let j = 0; j < 10; j++) {
                const aPoints = [];
                aPoints.push({y: y1  + j * yIncrement, x: (screenWidth - startWidth - (endWidth - startWidth) * (y1  + j * yIncrement) / length) / 2});
                aPoints.push({y: y1  + j * yIncrement, x: screenWidth - aPoints[0].x});
                aPoints.push({y: y1  + (j + 1) * yIncrement, x: (screenWidth + startWidth + (endWidth - startWidth) * (y1  + (j + 1) * yIncrement) / length) / 2}),
                aPoints.push({y: y1  + (j + 1) * yIncrement, x: screenWidth - aPoints[2].x});
                bridge.points.push(aPoints);
            }

            _objects.push(bridge);
        }

        //generate trees and helicopters, gasStation, airplane
        Object.keys(objects).filter(objectType => ['tree', 'helicopter','gasStation','airplane'].includes(objectType)).forEach(objectType => {
            const randomGen = new SeededRandom(objects[objectType].seed);
            const nObjects = objects[objectType].minNumber + Math.round(randomGen.next() * (objects[objectType].maxNumber - objects[objectType].minNumber));
            for (let j = 0; j < nObjects; j++) {
                let y;
                do {
                    y = Math.floor(randomGen.next() * length);
                } while (i === 0 && y < 200);
                const interpolatedWidth = startWidth + ((endWidth - startWidth) * y) / length;

                const leftBorder = (screenWidth - interpolatedWidth) / 2;
                const rightBorder = leftBorder + interpolatedWidth;

                let x;
                let direction = objects[objectType].movement !== 'still' ? (randomGen.next() > 0.5 ? 'ltr' : 'rtl') : undefined;
                if(objects[objectType].movement === 'still') {
                    if(objectType === 'tree') {
                        if (randomGen.next() < 0.5) {
                            x = Math.floor(randomGen.next() * (leftBorder - objects[objectType].size.width)) + objects[objectType].size.width / 2;
                        } else {
                            x = Math.floor(randomGen.next() * (screenWidth - rightBorder - objects[objectType].size.width)) + rightBorder + objects[objectType].size.width / 2;
                        }
                    } else {
                        x = leftBorder + Math.floor(randomGen.next() * (interpolatedWidth - objects[objectType].size.width)) + objects[objectType].size.width / 2;
                    }
                } else if(objects[objectType].movement === 'shuttle') {
                    if(direction === 'ltr') {
                        x = (screenWidth - (startWidth + (endWidth - startWidth) * y / length)) / 2;
                    } else {
                        x = screenWidth - (screenWidth - (startWidth + (endWidth - startWidth) * y / length)) / 2 - objects[objectType].size.width;
                    }
                } else if(objects[objectType].movement === 'oneWay') {
                    if(direction === 'ltr') {
                        x = objects[objectType].size.width / 2;
                    } else {
                        x = screenWidth - objects[objectType].size.width / 2;
                    }
                }
                _objects.push({type: objectType, x, y, direction });
            }
        });

        // Push the segment (startWidth, endWidth, length, objects)
        segments.push({
            offset: offset,
            startWidth: startWidth,
            endWidth: endWidth,
            length: length,
            objects: _objects,
        });
        offset += length;
    }
    return {
        river: segments,
        totalHeight: segments.reduce((acc, segment) => acc + segment.length, 0),
    };
}
