const fs = require('fs');
const path = require('path');

// 1. Copy SVG to public root
fs.copyFileSync(
  path.join(__dirname, '../public/brand/favicon.svg'),
  path.join(__dirname, '../public/favicon.svg')
);

// 2. Create a clean 16x16 + 32x32 ICO binary buffer
// ICO Header: 2 bytes reserved (0), 2 bytes type (1 for ICO), 2 bytes count of images (1)
function createSimpleIco(width, height) {
  const bpp = 32;
  const imageSize = 40 + width * height * 4; // BMP header (40) + pixel data
  const fileSize = 6 + 16 + imageSize;

  const buf = Buffer.alloc(fileSize);

  // ICO header
  buf.writeUInt16LE(0, 0); // reserved
  buf.writeUInt16LE(1, 2); // type: 1 = icon
  buf.writeUInt16LE(1, 4); // 1 image

  // Directory entry
  buf.writeUInt8(width === 256 ? 0 : width, 6);
  buf.writeUInt8(height === 256 ? 0 : height, 7);
  buf.writeUInt8(0, 8); // color palette
  buf.writeUInt8(0, 9); // reserved
  buf.writeUInt16LE(1, 10); // color planes
  buf.writeUInt16LE(bpp, 12); // bits per pixel
  buf.writeUInt32LE(imageSize, 14); // size of image data
  buf.writeUInt32LE(22, 18); // offset of BMP data

  // BMP InfoHeader
  const bmpOffset = 22;
  buf.writeUInt32LE(40, bmpOffset); // header size
  buf.writeInt32LE(width, bmpOffset + 4); // width
  buf.writeInt32LE(height * 2, bmpOffset + 8); // height * 2 (for XOR + AND mask)
  buf.writeUInt16LE(1, bmpOffset + 12); // planes
  buf.writeUInt16LE(bpp, bmpOffset + 14); // bit count
  buf.writeUInt32LE(0, bmpOffset + 16); // compression (none)
  buf.writeUInt32LE(width * height * 4, bmpOffset + 20); // image size
  buf.writeInt32LE(0, bmpOffset + 24); // x resolution
  buf.writeInt32LE(0, bmpOffset + 28); // y resolution
  buf.writeUInt32LE(0, bmpOffset + 32); // colors used
  buf.writeUInt32LE(0, bmpOffset + 36); // important colors

  // Pixel data (BGRA, bottom-to-top)
  // Base navy: #0f172a (B:42, G:23, R:15, A:255)
  // Emerald center: #10b981 (B:129, G:185, R:16, A:255)
  // Gold crest: #f59e0b (B:11, G:158, R:245, A:255)
  let pixelOffset = bmpOffset + 40;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let b = 42, g = 23, r = 15, a = 255;
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > width / 2) {
        a = 0; // transparent corners
      } else if (y >= height * 0.65 && Math.abs(dx) <= 2) {
        // Gold crest near top (inverted y)
        b = 11; g = 158; r = 245;
      } else if (y >= height * 0.25 && y < height * 0.65 && (Math.abs(dx) <= 1 || Math.abs(dist - width * 0.3) < 1.5)) {
        // Emerald growth arrow / nexus
        b = 129; g = 185; r = 16;
      }

      buf.writeUInt8(b, pixelOffset);
      buf.writeUInt8(g, pixelOffset + 1);
      buf.writeUInt8(r, pixelOffset + 2);
      buf.writeUInt8(a, pixelOffset + 3);
      pixelOffset += 4;
    }
  }

  return buf;
}

const icoBuffer = createSimpleIco(32, 32);
fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(__dirname, '../src/app/favicon.ico'), icoBuffer);
console.log('Successfully generated public/favicon.ico and src/app/favicon.ico');
