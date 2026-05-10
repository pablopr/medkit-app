import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface WavStats {
  durationSec: number;
  rms: number;
  peak: number;
}

function read16BitMonoWav(path: string): WavStats {
  const buf = readFileSync(path);
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WAVE');

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let data: Buffer | null = null;

  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + size;
    if (id === 'fmt ') {
      channels = buf.readUInt16LE(start + 2);
      sampleRate = buf.readUInt32LE(start + 4);
      bitsPerSample = buf.readUInt16LE(start + 14);
    } else if (id === 'data') {
      data = buf.subarray(start, end);
    }
    offset = end + (size % 2);
  }

  assert.equal(channels, 1);
  assert.equal(bitsPerSample, 16);
  assert.ok(data, 'missing data chunk');

  let sumSquares = 0;
  let peak = 0;
  const samples = data.length / 2;
  for (let i = 0; i < data.length; i += 2) {
    const s = data.readInt16LE(i);
    sumSquares += s * s;
    peak = Math.max(peak, Math.abs(s));
  }

  return {
    durationSec: samples / sampleRate,
    rms: Math.sqrt(sumSquares / samples),
    peak,
  };
}

test('generated audio assets are audible without clipping', () => {
  const root = join(process.cwd(), 'public', 'assets', 'audio');
  const expectations = [
    { file: 'ui-click.wav', minRms: 5_000, minDuration: 0.04 },
    { file: 'case-complete.wav', minRms: 4_000, minDuration: 0.12 },
    { file: 'vetkit-lobby-ambient.wav', minRms: 3_000, minDuration: 20 },
  ];

  for (const item of expectations) {
    const stats = read16BitMonoWav(join(root, item.file));
    assert.ok(stats.durationSec >= item.minDuration, `${item.file} is unexpectedly short`);
    assert.ok(stats.rms >= item.minRms, `${item.file} is too quiet: rms=${stats.rms.toFixed(1)}`);
    assert.ok(stats.peak < 30_000, `${item.file} is clipping: peak=${stats.peak}`);
  }
});

test('playback volume constants keep UI sounds audible', () => {
  const uiSoundLayer = readFileSync(join(process.cwd(), 'src', 'components', 'UiSoundLayer.tsx'), 'utf8');
  const backgroundMusic = readFileSync(join(process.cwd(), 'src', 'components', 'BackgroundMusic.tsx'), 'utf8');

  const click = Number(uiSoundLayer.match(/CLICK_VOLUME = ([0-9.]+)/)?.[1]);
  const complete = Number(uiSoundLayer.match(/COMPLETE_VOLUME = ([0-9.]+)/)?.[1]);
  const music = Number(backgroundMusic.match(/VOLUME = ([0-9.]+)/)?.[1]);

  assert.ok(click >= 0.2 && click <= 0.5, `CLICK_VOLUME out of range: ${click}`);
  assert.ok(complete >= 0.25 && complete <= 0.6, `COMPLETE_VOLUME out of range: ${complete}`);
  assert.ok(music >= 0.15 && music <= 0.35, `music VOLUME out of range: ${music}`);
});
