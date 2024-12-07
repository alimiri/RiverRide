import React from 'react';
import { Svg, Path } from 'react-native-svg';

const RiverPath = ({ width, height }) => {
  const riverPath = `
    M ${width / 4} 0
    C ${width / 3} ${height / 3}, ${width / 2} ${height / 2}, ${width / 3} ${height}
    L ${width * 0.75} ${height}
    C ${width * 0.67} ${height / 2}, ${width / 2} ${height / 3}, ${width * 0.75} 0
    Z
  `;

  return (
    <Svg width={width} height={height} style={{ position: 'absolute' }}>
      {/* River */}
      <Path d={riverPath} fill="blue" />

      {/* River Border */}
      <Path d={`M ${width / 4} 0 C ${width / 3} ${height / 3}, ${width / 2} ${height / 2}, ${width / 3} ${height}`}
            stroke="white" strokeWidth="5" fill="none" />
      <Path d={`M ${width * 0.75} 0 C ${width * 0.67} ${height / 3}, ${width / 2} ${height / 2}, ${width * 0.75} ${height}`}
            stroke="white" strokeWidth="5" fill="none" />
    </Svg>
  );
};

export default RiverPath;
