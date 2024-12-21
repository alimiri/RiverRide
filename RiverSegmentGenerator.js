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
    treeWidth,
    seeds,
    helicopterWidth,
) {
    const {seedW, seedH, seedTree, seedBridge, seedHelicopter} = seeds;
    const randomW = new SeededRandom(seedW); // Seeded RNG for width
    const randomH = new SeededRandom(seedH); // Seeded RNG for length
    const randomTree = new SeededRandom(seedTree); // Seeded RNG for trees

    let segments = [];
    let startWidth = maxWidth;
    let endWidth;
    let offset = 0;

    for (let i = 0; i < numSegments; i++) {
        const trees = [];
        const nTrees = 1;//Math.round(randomTree.next() * 10); // Random number of trees

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

        // Generate random trees for the segment
        for (let j = 0; j < nTrees; j++) {
            const y = Math.floor(randomTree.next() * length); // Random y within segment length

            // Calculate the river's width at this y (interpolated between startWidth and endWidth)
            const interpolatedWidth = startWidth + ((endWidth - startWidth) * y) / length;

            // Calculate the river's left and right borders at this y
            const leftBorder = (screenWidth - interpolatedWidth) / 2;
            const rightBorder = leftBorder + interpolatedWidth;

            // Adjust for treeWidth to prevent overlap with the river
            let x;
            if (randomTree.next() < 0.5) {
                // Place the tree to the left of the river
                x = Math.floor(randomTree.next() * (leftBorder - treeWidth));
            } else {
                // Place the tree to the right of the river
                x = Math.floor(randomTree.next() * (screenWidth - rightBorder - treeWidth)) + rightBorder + treeWidth;
            }

            // Add the tree position
            trees.push({ x, y });
        }

        //generate briges
        const bridges = [];
        if(true) {
            const bridge = {points: []};
            const y1 = length / 2 - 50;
            const y2 = length / 2 + 50;
            const yIncrement = (y2 - y1) / 10;

            for(let j = 0; j < 10; j++) {
                const aPoints = [];
                aPoints.push({y: y1  + j * yIncrement, x: (screenWidth - startWidth - (endWidth - startWidth) * (y1  + j * yIncrement) / length) / 2});
                aPoints.push({y: y1  + j * yIncrement, x: screenWidth - aPoints[0].x});
                aPoints.push({y: y1  + (j + 1) * yIncrement, x: (screenWidth + startWidth + (endWidth - startWidth) * (y1  + (j + 1) * yIncrement) / length) / 2}),
                aPoints.push({y: y1  + (j + 1) * yIncrement, x: screenWidth - aPoints[2].x});
                bridge.points.push(aPoints);
            }
            bridge.y1 = length / 2 - 100;
            bridge.y2 = bridge.y1;
            let interpolatedWidth = (screenWidth - startWidth - ((endWidth - startWidth) * bridge.y1) / length) / 2;
            bridge.x1 = (screenWidth - interpolatedWidth) / 2;
            bridge.x2 = bridge.x1 + interpolatedWidth;

            bridge.y3 = length / 2 + 100;
            bridge.y4 = bridge.y3;
            interpolatedWidth = startWidth + ((endWidth - startWidth) * bridge.y3) / length;
            bridge.x3 = (screenWidth - interpolatedWidth) / 2;
            bridge.x4 = bridge.x3 + interpolatedWidth;

            bridges.push(bridge);
        }

        //generate helicopters
        const helicopters = [];
        if(true) {
            let y = length / 4;
            let helicopter = {x: (screenWidth - (startWidth + (endWidth - startWidth) * y / length)) / 2, y: y, direction: 'ltr'};
            helicopters.push(helicopter);
            y = length * 3 / 4;
            helicopter = {x: screenWidth - (screenWidth - (startWidth + (endWidth - startWidth) * y / length)) / 2 - helicopterWidth, y: y, direction: 'rtl'};
            helicopters.push(helicopter);
        }

        // Push the segment (startWidth, endWidth, length, trees)
        segments.push({
            offset: offset,
            startWidth: startWidth,
            endWidth: endWidth,
            length: length,
            trees: trees,
            bridges: bridges,
            helicopters: helicopters,
        });
        offset += length;
    }
    return {
        river: segments,
        totalHeight: segments.reduce((acc, segment) => acc + segment.length, 0),
    };
}
