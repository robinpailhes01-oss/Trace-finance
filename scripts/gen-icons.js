// Generates PNG icons from public/icon.svg
// Usage: node scripts/gen-icons.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const svg = fs.readFileSync(path.join(__dirname, "..", "public", "icon.svg"));

async function gen(size, outName) {
  const out = path.join(__dirname, "..", "public", outName);
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("→", outName, `(${size}x${size})`);
}

(async () => {
  await gen(512, "icon-512.png");
  await gen(192, "icon-192.png");
  await gen(180, "apple-touch-icon.png");
})();
