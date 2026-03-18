import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildPkPassArchiveEntries, buildPkPassBuffer } from '../../app/lib/apple-pkpass-archive.ts';

test('buildPkPassBuffer includes strip@2x.png when present', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pkpass-archive-test-'));

  try {
    const archive = buildPkPassArchiveEntries();
    const requiredFiles = {
      'pass.json': '{}',
      'manifest.json': '{}',
      signature: 'signature',
      'icon.png': 'icon',
      'logo.png': 'logo',
    } as const;
    const optionalFiles = {
      'strip.png': 'strip',
      'strip@2x.png': 'strip-retina',
    } as const;

    await Promise.all([
      ...Object.entries(requiredFiles).map(([name, contents]) => writeFile(join(tempDir, name), contents)),
      ...Object.entries(optionalFiles).map(([name, contents]) => writeFile(join(tempDir, name), contents)),
    ]);

    const pkpass = await buildPkPassBuffer(tempDir, archive);
    const pkpassPath = join(tempDir, 'result.pkpass');
    await writeFile(pkpassPath, pkpass);

    const zipEntries = execFileSync('unzip', ['-Z1', pkpassPath], { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    assert.deepEqual(
      zipEntries,
      ['pass.json', 'manifest.json', 'signature', 'icon.png', 'logo.png', 'strip.png', 'strip@2x.png'],
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
