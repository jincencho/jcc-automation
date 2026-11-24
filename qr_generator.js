/**
 * Compact QR Code generator in JavaScript
 * Produces an ultra-lightweight SVG string for any URL.
 */

const QRCode = (function() {
  const MODE_8BIT_BYTE = 1 << 2;
  const ECL_M = 0;

  const EXP_TABLE = new Array(256);
  const LOG_TABLE = new Array(256);
  for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
  for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;

  function glog(n) { if (n < 1) throw new Error("glog(" + n + ")"); return LOG_TABLE[n]; }
  function gexp(n) { while (n < 0) n += 255; while (n >= 255) n -= 255; return EXP_TABLE[n]; }

  function Polynomial(num, shift) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  Polynomial.prototype = {
    get: function(index) { return this.num[index]; },
    getLength: function() { return this.num.length; },
    multiply: function(e) {
      const num = new Array(this.getLength() + e.getLength() - 1);
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
        }
      }
      return new Polynomial(num, 0);
    },
    mod: function(e) {
      if (this.getLength() - e.getLength() < 0) return this;
      const ratio = glog(this.get(0)) - glog(e.get(0));
      const num = new Array(this.getLength());
      for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (let i = 0; i < e.getLength(); i++) num[i] ^= gexp(glog(e.get(i)) + ratio);
      return new Polynomial(num, 0).mod(e);
    }
  };

  const RS_BLOCK_TABLE = [
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15]
  ];

  function getRSBlocks(typeNumber, errorCorrectLevel) {
    const rsBlock = RS_BLOCK_TABLE[(typeNumber - 1) * 4 + errorCorrectLevel];
    if (!rsBlock) throw new Error("bad RS block");
    const list = [];
    for (let i = 0; i < rsBlock.length; i += 3) {
      const count = rsBlock[i];
      const totalCount = rsBlock[i + 1];
      const dataCount = rsBlock[i + 2];
      for (let j = 0; j < count; j++) {
        list.push({ totalCount: totalCount, dataCount: dataCount });
      }
    }
    return list;
  }

  function QRBitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  QRBitBuffer.prototype = {
    get: function(index) { return ((this.buffer[Math.floor(index / 8)] >>> (7 - index % 8)) & 1) === 1; },
    put: function(num, length) { for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1); },
    putBit: function(bit) {
      const bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      this.length++;
    }
  };

  function QRCodeModel(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataList = [];
  }
  QRCodeModel.prototype = {
    addData: function(data) {
      this.dataList.push({
        mode: MODE_8BIT_BYTE,
        data: data,
        getLength: function() { return Buffer.byteLength(data, 'utf8'); },
        write: function(buffer) {
          const bytes = Buffer.from(data, 'utf8');
          for (let i = 0; i < bytes.length; i++) buffer.put(bytes[i], 8);
        }
      });
    },
    isDark: function(row, col) { return this.modules[row][col]; },
    make: function() {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (let row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount);
        for (let col = 0; col < this.moduleCount; col++) this.modules[row][col] = null;
      }
      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupTimingPattern();
      this.setupPositionAdjustPattern();
      this.setupTypeInfo(false, 0);
      this.mapData(this.createData(this.typeNumber, this.errorCorrectLevel, this.dataList), 0);
    },
    setupPositionProbePattern: function(row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;
          if ((0 <= r && r <= 6 && (c == 0 || c == 6)) || (0 <= c && c <= 6 && (r == 0 || r == 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    },
    setupTimingPattern: function() {
      for (let r = 8; r < this.moduleCount - 8; r++) {
        if (this.modules[r][6] !== null) continue;
        this.modules[r][6] = (r % 2 === 0);
      }
      for (let c = 8; c < this.moduleCount - 8; c++) {
        if (this.modules[6][c] !== null) continue;
        this.modules[6][c] = (c % 2 === 0);
      }
    },
    setupPositionAdjustPattern: function() {
      const pos = [6, 18, 22, 26, 30, 34][this.typeNumber - 1];
      if (!pos || this.typeNumber < 2) return;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
            this.modules[pos + r][pos + c] = true;
          } else {
            this.modules[pos + r][pos + c] = false;
          }
        }
      }
    },
    setupTypeInfo: function(test, maskPattern) {
      const data = (this.errorCorrectLevel << 3) | maskPattern;
      const bits = (function(d) {
        let b = d << 10;
        while (b >= (1 << 10)) {
          let s = 0;
          let temp = b;
          while (temp > 1) { temp >>>= 1; s++; }
          b ^= (0x537 << (s - 10));
        }
        return ((d << 10) | b) ^ 0x5412;
      })(data);

      for (let i = 0; i < 15; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 6) this.modules[i][8] = mod;
        else if (i < 8) this.modules[i + 1][8] = mod;
        else this.modules[this.moduleCount - 15 + i][8] = mod;

        if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
        else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
        else this.modules[8][15 - i - 1] = mod;
      }
      this.modules[this.moduleCount - 8][8] = (!test);
    },
    mapData: function(data, maskPattern) {
      let inc = -1;
      let row = this.moduleCount - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (this.modules[row][col - c] === null) {
              let dark = false;
              if (byteIndex < data.length) dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
              const mask = (row + col - c) % 2 === 0;
              if (mask) dark = !dark;
              this.modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) { row -= inc; inc = -inc; break; }
        }
      }
    },
    createData: function(typeNumber, errorCorrectLevel, dataList) {
      const rsBlocks = getRSBlocks(typeNumber, errorCorrectLevel);
      const buffer = new QRBitBuffer();
      for (let i = 0; i < dataList.length; i++) {
        const data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), 8);
        data.write(buffer);
      }
      let totalDataCount = 0;
      for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
      if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
      while (buffer.length % 8 !== 0) buffer.putBit(false);
      while (true) {
        if (buffer.length >= totalDataCount * 8) break;
        buffer.put(0xec, 8);
        if (buffer.length >= totalDataCount * 8) break;
        buffer.put(0x11, 8);
      }
      return buffer.buffer;
    },
    toCompactSvg: function(size = 56) {
      const count = this.moduleCount;
      let pathD = '';
      for (let r = 0; r < count; r++) {
        let startCol = -1;
        for (let c = 0; c < count; c++) {
          if (this.isDark(r, c)) {
            if (startCol === -1) startCol = c;
          } else {
            if (startCol !== -1) {
              pathD += `M${startCol},${r}h${c - startCol}v1h-${c - startCol}z `;
              startCol = -1;
            }
          }
        }
        if (startCol !== -1) {
          pathD += `M${startCol},${r}h${count - startCol}v1h-${count - startCol}z `;
        }
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${count} ${count}" width="${size}" height="${size}"><rect width="${count}" height="${count}" fill="#ffffff"/><path d="${pathD}" fill="#0f172a"/></svg>`;
    }
  };

  return {
    generateSvg: function(text, typeNumber = 5, size = 56) {
      const qr = new QRCodeModel(typeNumber, ECL_M);
      qr.addData(text);
      qr.make();
      return qr.toCompactSvg(size);
    }
  };
})();

module.exports = QRCode;
