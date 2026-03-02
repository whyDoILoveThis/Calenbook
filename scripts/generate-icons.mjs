import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a PNG with a calendar-grid pattern inspired by CalendarClock.
 * Uses raw pixel manipulation for zero external dependencies.
 */
function createIconPng(size, bgR, bgG, bgB) {
  const width = size;
  const height = size;

  const pixelData = [];
  const gridSize = Math.floor(size / 4);
  const padding = Math.floor(size * 0.1);
  const lineColor = [255, 255, 255];

  for (let y = 0; y < height; y++) {
    pixelData.push(0);

    for (let x = 0; x < width; x++) {
      let r = bgR,
        g = bgG,
        b = bgB,
        a = 255;

      if (
        y < padding ||
        y >= height - padding ||
        x < padding ||
        x >= width - padding
      ) {
        [r, g, b] = lineColor;
      } else {
        const gridX = Math.floor((x - padding) / gridSize);
        const gridY = Math.floor((y - padding) / gridSize);
        const inGridX = (x - padding) % gridSize;
        const inGridY = (y - padding) % gridSize;

        if ((gridX + gridY) % 2 === 1) {
          const darkened = 0.8;
          r = Math.floor(bgR * darkened);
          g = Math.floor(bgG * darkened);
          b = Math.floor(bgB * darkened);
        }

        if (inGridX < 2 || inGridY < 2) {
          [r, g, b] = lineColor;
        }
      }

      pixelData.push(r, g, b, a);
    }
  }

  const rawBuf = Buffer.from(pixelData);
  const compressed = zlib.deflateSync(rawBuf);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, "ascii");
    const body = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const actualOutDir = path.join(__dirname, "..", "public", "icons");

if (!fs.existsSync(actualOutDir)) {
  fs.mkdirSync(actualOutDir, { recursive: true });
}

const sizes = [192, 512];
const bgR = 147,
  bgG = 51,
  bgB = 234;

for (const size of sizes) {
  const png = createIconPng(size, bgR, bgG, bgB);
  fs.writeFileSync(path.join(actualOutDir, `icon-${size}x${size}.png`), png);
  console.log(`✓ Created icon-${size}x${size}.png`);
}

for (const size of sizes) {
  const png = createIconPng(size, bgR, bgG, bgB);
  fs.writeFileSync(
    path.join(actualOutDir, `icon-maskable-${size}x${size}.png`),
    png
  );
  console.log(`✓ Created icon-maskable-${size}x${size}.png`);
}

const applePng = createIconPng(180, bgR, bgG, bgB);
fs.writeFileSync(path.join(actualOutDir, "apple-touch-icon.png"), applePng);
console.log(`✓ Created apple-touch-icon.png`);

console.log("\n📅 Icons generated with calendar-grid pattern!\n");
console.log("For the exact lucide CalendarClock icon:");
console.log("  1. Open Figma/design tool");
console.log("  2. Import lucide CalendarClock SVG");
console.log("  3. Export PNG (192×192, 512×512, 180×180)");
console.log("  4. Replace files in public/icons/");


