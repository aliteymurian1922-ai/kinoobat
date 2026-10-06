// Generates on-brand PNG icons (ticket motif) without any dependency.
// Design: accent background, white ticket with punched notches,
// an ink "number window" band and two ink text bars.
import { deflateSync } from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

const ACCENT = [255, 107, 53, 255];
const WHITE = [255, 255, 255, 255];
const INK = [23, 23, 23, 255];

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function inRRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r;
  const qy = Math.abs(py - cy) - hh + r;
  if (qx > r || qy > r) return false;
  const dx = Math.max(qx, 0);
  const dy = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(dx, dy) <= r;
}

function inCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) <= r;
}

// all coordinates in 512-space
function pick(px, py) {
  // background
  let color = ACCENT;
  // white ticket
  if (inRRect(px, py, 256, 256, 140, 180, 48)) color = WHITE;
  // punched notches
  if (inCircle(px, py, 116, 256, 40)) color = ACCENT;
  if (inCircle(px, py, 396, 256, 40)) color = ACCENT;
  // number window band
  if (inRRect(px, py, 256, 156, 110, 40, 24)) color = INK;
  // number glyphs (three white blocks)
  if (inRRect(px, py, 172, 156, 22, 32, 10)) color = WHITE;
  if (inRRect(px, py, 256, 156, 22, 32, 10)) color = WHITE;
  if (inRRect(px, py, 340, 156, 22, 32, 10)) color = WHITE;
  // text bars
  if (inRRect(px, py, 256, 258, 90, 14, 14)) color = INK;
  if (inRRect(px, py, 256, 312, 60, 14, 14)) color = INK;
  return color;
}

function render(size) {
  const s = size / 512;
  const buf = Buffer.alloc(size * size * 4);
  const SS = 2; // 2x2 supersampling
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = pick((x + (sx + 0.5) / SS) / s, (y + (sy + 0.5) / SS) / s);
          r += c[0]; g += c[1]; b += c[2]; a += c[3];
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = Math.round(a / n);
    }
  }
  return buf;
}

for (const size of [512, 192, 180]) {
  const png = encodePng(size, render(size));
  const file =
    size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  fs.writeFileSync(path.join(OUT_DIR, file), png);
  console.log(`wrote ${file} (${png.length} bytes)`);
}
