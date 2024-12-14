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
    seedW,
    seedH,
    seedTree,
    treeWidth
) {
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
            const interpolatedWidth =
                startWidth + ((endWidth - startWidth) * y) / length;

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

        // Push the segment (startWidth, endWidth, length, trees)
        segments.push({
            offset: offset,
            startWidth: startWidth,
            endWidth: endWidth,
            length: length,
            trees: trees,
        });
        offset += length;
    }

    return {
        river: segments,
        totalHeight: segments.reduce((acc, segment) => acc + segment.length, 0),
    };
}
