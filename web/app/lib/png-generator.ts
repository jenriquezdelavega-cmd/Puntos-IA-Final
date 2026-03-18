/**
 * Generates a minimal valid PNG buffer (solid color rectangle) without any
 * external dependencies. Used as a guaranteed fallback strip image for
 * Apple Wallet passes when Satori/next-og fails to render.
 */

function adler32(data: Uint8Array): number {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function crc32(data: Uint8Array): number {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of data) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32BE(buf: Buffer, offset: number, value: number) {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const typeBytes = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([typeBytes, Buffer.from(data)]);
  const crc = crc32(combined);
  const buf = Buffer.alloc(4 + 4 + data.length + 4);
  writeUint32BE(buf, 0, data.length);
  typeBytes.copy(buf, 4);
  Buffer.from(data).copy(buf, 8);
  writeUint32BE(buf, 8 + data.length, crc);
  return buf;
}

function deflateNoCompression(data: Uint8Array): Uint8Array {
  // zlib header (no compression) + raw DEFLATE blocks
  const maxBlockSize = 65535;
  const blocks: Uint8Array[] = [];
  let offset = 0;
  while (offset < data.length || data.length === 0) {
    const remaining = data.length - offset;
    const blockSize = Math.min(maxBlockSize, remaining);
    const isLast = offset + blockSize >= data.length;
    const block = new Uint8Array(5 + blockSize);
    block[0] = isLast ? 1 : 0; // BFINAL | BTYPE=00 (no compression)
    block[1] = blockSize & 0xff;
    block[2] = (blockSize >>> 8) & 0xff;
    block[3] = (~blockSize) & 0xff;
    block[4] = ((~blockSize) >>> 8) & 0xff;
    block.set(data.subarray(offset, offset + blockSize), 5);
    blocks.push(block);
    offset += blockSize;
    if (isLast) break;
  }
  const rawData = Buffer.concat(blocks.map(b => Buffer.from(b)));
  const adler = adler32(data);

  // zlib wrapper: CMF=0x78 (deflate, window=32K), FLG computed to make CMF*256+FLG divisible by 31
  const cmf = 0x78;
  const flg = 0x9c; // preset dictionary=0, check bits
  const result = new Uint8Array(2 + rawData.length + 4);
  result[0] = cmf;
  result[1] = flg;
  rawData.copy(Buffer.from(result.buffer, result.byteOffset), 2);
  result[2 + rawData.length] = (adler >>> 24) & 0xff;
  result[2 + rawData.length + 1] = (adler >>> 16) & 0xff;
  result[2 + rawData.length + 2] = (adler >>> 8) & 0xff;
  result[2 + rawData.length + 3] = adler & 0xff;
  return result;
}

/**
 * Generate a solid-color PNG (no external libs, no Satori).
 * Returns a Buffer with a valid PNG file.
 */
export function generateSolidColorPng(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): Buffer {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit-depth=8, color-type=2 (RGB)
  const ihdr = new Uint8Array(13);
  const ihdrBuf = Buffer.from(ihdr.buffer);
  writeUint32BE(ihdrBuf, 0, width);
  writeUint32BE(ihdrBuf, 4, height);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Build raw scanlines: filter byte (0) + RGB per pixel
  const scanlineLen = 1 + width * 3;
  const raw = new Uint8Array(height * scanlineLen);
  for (let y = 0; y < height; y++) {
    const base = y * scanlineLen;
    raw[base] = 0; // filter type: None
    for (let x = 0; x < width; x++) {
      raw[base + 1 + x * 3] = r;
      raw[base + 1 + x * 3 + 1] = g;
      raw[base + 1 + x * 3 + 2] = b;
    }
  }

  const compressed = deflateNoCompression(raw);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', new Uint8Array(0));

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    idat,
    iend,
  ]);
}
