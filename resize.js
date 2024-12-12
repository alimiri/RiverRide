const sharp = require('sharp');
const inputPath = 'C:\\ios\\RiverRaid\\assets\\a.webp';
const outputPath = 'C:\\ios\\RiverRaid\\assets\\tree.png';

sharp(inputPath)
  .ensureAlpha() // Ensure alpha channel for transparency
  .toFormat('png')
  .toFile(outputPath, (err, info) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Image saved with transparent background:', info);
    }
  });

  sharp(outputPath)
  .metadata()
  .then(metadata => {
    console.log(metadata); // Check if the alpha channel exists
    if (metadata.hasAlpha) {
      console.log('The image has transparency.');
    } else {
      console.log('The image does not have transparency.');
    }
  })
  .catch(err => {
    console.error('Error reading image metadata:', err);
  });