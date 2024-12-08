class SeededRandom {
    constructor(seed) {
        this.seed = seed;
        this.x = Math.sin(this.seed) * 10000; // Initialize with the seed
    }

    next() {
        this.x = Math.sin(this.x) * 10000;
        return this.x - Math.floor(this.x);  // Return fractional part for randomness
    }
}

export default function generateRiverSegments(minWidth, maxWidth, minLength, maxLength, numSegments, seedW, seedH) {
    const randomW = new SeededRandom(seedW);  // Seeded RNG
    const randomH = new SeededRandom(seedH);  // Seeded RNG
    let segments = [];
    let startWidth = maxWidth;

    let endWidth;
    for (let i = 0; i < numSegments; i++) {
        let length = minLength + Math.floor((maxLength - minLength) * randomH.next());
        if(i === 0) {
            startWidth = Math.floor(randomW.next() * (maxWidth - minWidth + 1)) + minWidth;
            endWidth = startWidth;
        } else if(segments[i-1].endWidth !== segments[i-1].startWidth) {
            startWidth = segments[i-1].endWidth;
            endWidth = startWidth;
        } else {
            const r = randomW.next();
            if(r > 0.45 && r < 0.55) {//sharp change the width
                startWidth = Math.floor(randomW.next() * (maxWidth - minWidth + 1)) + minWidth;
                endWidth = startWidth;
            } else {
                startWidth = segments[i-1].endWidth;
                endWidth = Math.floor(randomW.next() * (maxWidth - minWidth + 1)) + minWidth;
                length = minLength;
            }
        }
        // Push the segment (startWidth, endWidth, length)
        segments.push({ startWidth: startWidth, endWidth: endWidth, length: length });
    }
    return segments;
};
