/**
 * Generate PWA Icons
 * Run with: node server/scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function createSVGIcon(size) {
  const colors = {
    background: '#000000',
    backgroundGradient: '#333333',
    text: '#ffffff',
    accent: '#4CAF50'
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.background};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.backgroundGradient};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.1}" ry="${size * 0.1}"/>
  
  <!-- Letter M -->
  <text x="50%" y="50%" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-weight="bold" 
        font-size="${size * 0.5}" 
        fill="${colors.text}" 
        text-anchor="middle" 
        dominant-baseline="middle"
        dy="${size * 0.05}">M</text>
  
  <!-- Pulse indicator -->
  <circle cx="${size * 0.75}" cy="${size * 0.75}" r="${size * 0.1}" 
          fill="none" 
          stroke="${colors.accent}" 
          stroke-width="${size * 0.02}"/>
  <circle cx="${size * 0.75}" cy="${size * 0.75}" r="${size * 0.04}" 
          fill="${colors.accent}"/>
</svg>`;
}

// Generate SVG icons
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg, 'utf8');
  console.log(`Generated: ${filename}`);
});

console.log('\nSVG icons generated successfully!');
console.log('Note: SVG icons are used for development. For production, consider converting to PNG for better compatibility.');
console.log('You can use online tools like https://cloudconvert.com/svg-to-png to convert SVG to PNG.');