// Generates app icons (no deps) — a dumbbell on a dark rounded background.
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

function hex(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

function makePNG(size, file) {
  const bg = hex("#14161d");
  const ring = hex("#0a0b0f");
  const accent = hex("#4ade80");
  const buf = Buffer.alloc(size * size * 4);

  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  };

  const s = size;
  const radius = s * 0.22;
  // rounded rect background
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      let inside = true;
      const corners = [
        [radius, radius],
        [s - radius, radius],
        [radius, s - radius],
        [s - radius, s - radius],
      ];
      if (x < radius && y < radius)
        inside = Math.hypot(x - corners[0][0], y - corners[0][1]) <= radius;
      else if (x > s - radius && y < radius)
        inside = Math.hypot(x - corners[1][0], y - corners[1][1]) <= radius;
      else if (x < radius && y > s - radius)
        inside = Math.hypot(x - corners[2][0], y - corners[2][1]) <= radius;
      else if (x > s - radius && y > s - radius)
        inside = Math.hypot(x - corners[3][0], y - corners[3][1]) <= radius;
      if (inside) set(x, y, bg, 255);
    }
  }

  // dumbbell, rotated 45deg, centered
  const cx = s / 2;
  const cy = s / 2;
  const u = s / 32; // unit
  const rot = (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const a = -Math.PI / 4;
    return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
  };
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const [lx, ly] = rot(x, y);
      const bar = Math.abs(ly) <= u * 1.1 && Math.abs(lx) <= u * 5;
      const innerPlate =
        Math.abs(ly) <= u * 3 && Math.abs(Math.abs(lx) - u * 5.5) <= u * 1.2;
      const outerPlate =
        Math.abs(ly) <= u * 4.5 && Math.abs(Math.abs(lx) - u * 7.5) <= u * 1.4;
      if (bar || innerPlate || outerPlate) set(x, y, accent, 255);
    }
  }
  void ring;

  // encode PNG
  const raw = Buffer.alloc((s * 4 + 1) * s);
  for (let y = 0; y < s; y++) {
    raw[y * (s * 4 + 1)] = 0;
    buf.copy(raw, y * (s * 4 + 1) + 1, y * s * 4, (y + 1) * s * 4);
  }
  const idat = zlib.deflateSync(raw);

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const tb = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([tb, data])) >>> 0);
    return Buffer.concat([len, tb, data, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0);
  ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log("wrote", file);
}

let crcTable;
function crc32(buf) {
  if (!crcTable) {
    crcTable = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return crc ^ 0xffffffff;
}

const pub = path.join(__dirname, "..", "public");
makePNG(192, path.join(pub, "icon-192.png"));
makePNG(512, path.join(pub, "icon-512.png"));
makePNG(180, path.join(pub, "apple-icon.png"));
