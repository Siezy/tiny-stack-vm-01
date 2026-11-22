// Tiny stack VM, ISA v1 — faithful reimplementation of the kit reference vm.mjs.
// Plain JavaScript, Node builtins only. Reads /input/<id>/{program,input}.bin,
// writes /output/<id>/{stdout.bin,exit.txt}.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const enc = new TextEncoder();
// Per-opcode table: [immediate bytes, pops, pushes]. Absent opcode = trap 5.
const TABLE = [];
for (const [op, imm, pops, pushes] of [
  [0x00, 0, 0, 0], [0x01, 1, 0, 1], [0x02, 4, 0, 1], [0x03, 0, 1, 0],
  [0x04, 0, 1, 2], [0x05, 0, 2, 2], [0x06, 0, 2, 3], [0x07, 0, 3, 3],
  [0x10, 0, 2, 1], [0x11, 0, 2, 1], [0x12, 0, 2, 1], [0x13, 0, 2, 1],
  [0x14, 0, 2, 1], [0x15, 0, 2, 1], [0x16, 0, 2, 1], [0x17, 0, 1, 1],
  [0x18, 0, 2, 1], [0x19, 0, 2, 1], [0x1a, 0, 2, 1], [0x1b, 0, 1, 1],
  [0x1c, 0, 2, 1], [0x1d, 0, 2, 1], [0x1e, 0, 2, 1], [0x20, 0, 2, 1],
  [0x21, 0, 2, 1], [0x22, 0, 2, 1], [0x30, 2, 0, 0], [0x31, 2, 1, 0],
  [0x32, 2, 1, 0], [0x33, 2, 0, 0], [0x34, 0, 0, 0], [0x40, 0, 1, 1],
  [0x41, 0, 2, 0], [0x50, 0, 1, 0], [0x51, 0, 1, 0], [0x52, 0, 0, 1],
  [0x53, 0, 1, 0],
]) TABLE[op] = [imm, pops, pushes];

function run(prog, input) {
  const n = prog.length;
  const d = new Int32Array(256);
  const c = new Int32Array(64);
  const m = new Int32Array(256);
  const out = new Uint8Array(65536);
  let sp = 0, cp = 0, ol = 0, ip = 0, pc = 0, steps = 0;
  const done = (code) => [out.slice(0, ol), code];
  for (;;) {
    // vm.mjs check order: step limit, pc bounds, bad opcode, immediate cut
    // off; then the step counts and stack needs are checked.
    if (steps === 1000000) return done(10);
    if (pc < 0 || pc >= n) return done(9);
    const op = prog[pc];
    const t = TABLE[op];
    if (t === undefined) return done(5);
    const imm = t[0], pops = t[1], pushes = t[2];
    if (pc + imm >= n) return done(9);
    steps++;
    const nx = pc + 1 + imm;
    if (sp < pops) return done(2);
    if (sp - pops + pushes > 256) return done(3);
    pc = nx;
    switch (op) {
      case 0x00: return done(0);
      case 0x01: d[sp++] = (prog[nx - 1] << 24) >> 24; break;
      case 0x02: d[sp++] = prog[nx - 4] | (prog[nx - 3] << 8) | (prog[nx - 2] << 16) | (prog[nx - 1] << 24); break;
      case 0x03: sp--; break;
      case 0x04: d[sp] = d[sp - 1]; sp++; break;
      case 0x05: { const x = d[sp - 1]; d[sp - 1] = d[sp - 2]; d[sp - 2] = x; break; }
      case 0x06: d[sp] = d[sp - 2]; sp++; break;
      case 0x07: { const x = d[sp - 3]; d[sp - 3] = d[sp - 2]; d[sp - 2] = d[sp - 1]; d[sp - 1] = x; break; }
      case 0x17: d[sp - 1] = -d[sp - 1] | 0; break;
      case 0x1b: d[sp - 1] = ~d[sp - 1]; break;
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15:
      case 0x16: case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d:
      case 0x1e: case 0x20: case 0x21: case 0x22: {
        const b = d[sp - 1], a = d[sp - 2];
        let r;
        switch (op) {
          case 0x10: r = (a + b) | 0; break;
          case 0x11: r = (a - b) | 0; break;
          case 0x12: r = Math.imul(a, b); break;
          case 0x13:
            if (b === 0) return done(4);
            r = a === -2147483648 && b === -1 ? a : (a / b) | 0;
            break;
          case 0x14:
            if (b === 0) return done(4);
            r = b === -1 ? 0 : (a % b) | 0;
            break;
          case 0x15:
            if (b === 0) return done(4);
            r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
            break;
          case 0x16:
            if (b === 0) return done(4);
            r = ((a >>> 0) % (b >>> 0)) | 0;
            break;
          case 0x18: r = a & b; break;
          case 0x19: r = a | b; break;
          case 0x1a: r = a ^ b; break;
          case 0x1c: r = a << (b & 31); break;
          case 0x1d: r = a >> (b & 31); break;
          case 0x1e: r = (a >>> (b & 31)) | 0; break;
          case 0x20: r = a === b ? 1 : 0; break;
          case 0x21: r = a < b ? 1 : 0; break;
          case 0x22: r = (a >>> 0) < (b >>> 0) ? 1 : 0; break;
        }
        sp -= 2;
        d[sp++] = r;
        break;
      }
      case 0x30: case 0x31: case 0x32: {
        const rel = ((prog[nx - 2] | (prog[nx - 1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 0x30) {
          const v = d[--sp];
          take = op === 0x31 ? v === 0 : v !== 0;
        }
        if (take) pc = nx + rel;
        break;
      }
      case 0x33:
        if (cp === 64) return done(7);
        c[cp++] = nx;
        pc = prog[nx - 2] | (prog[nx - 1] << 8);
        break;
      case 0x34:
        if (cp === 0) return done(8);
        pc = c[--cp];
        break;
      case 0x40: {
        const addr = d[sp - 1];
        if (addr < 0 || addr > 255) return done(6);
        d[sp - 1] = m[addr];
        break;
      }
      case 0x41: {
        const addr = d[sp - 1];
        if (addr < 0 || addr > 255) return done(6);
        m[addr] = d[sp - 2];
        sp -= 2;
        break;
      }
      case 0x50: {
        const s = enc.encode(String(d[sp - 1]));
        if (ol + s.length > 65536) return done(11);
        sp--;
        out.set(s, ol);
        ol += s.length;
        break;
      }
      case 0x51:
        if (ol + 1 > 65536) return done(11);
        out[ol++] = d[--sp] & 255;
        break;
      case 0x52: d[sp++] = ip < input.length ? input[ip++] : -1; break;
      case 0x53: return done(d[--sp] & 255);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const [o, code] = run(readFileSync(join(I, id, 'program.bin')), readFileSync(join(I, id, 'input.bin')));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), o);
  writeFileSync(join(O, id, 'exit.txt'), code + '\n');
}
