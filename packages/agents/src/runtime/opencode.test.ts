import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cliPreset } from '@bugpatrol/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { describeRuntime, runtimeProblem } from './index.js';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'bugpatrol-opencode-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/** An `opencode` on PATH that prints `version`, or fails when it is undefined. */
async function fakeOpencode(version: string | undefined): Promise<NodeJS.ProcessEnv> {
  const body = version === undefined ? 'exit 1' : `echo '${version}'`;
  await writeFile(join(root, 'opencode'), `#!/bin/sh\n${body}\n`);
  await chmod(join(root, 'opencode'), 0o755);
  return { PATH: `${root}:/usr/bin:/bin` };
}

const explorer = { runtime: 'cli', command: cliPreset('opencode', 'explorer') } as const;

describe('the opencode preset', () => {
  it('is ready on opencode 1.x', async () => {
    expect(runtimeProblem('explorer', explorer, await fakeOpencode('1.18.26'))).toBeUndefined();
  });

  it('refuses opencode 2.x', async () => {
    expect(runtimeProblem('explorer', explorer, await fakeOpencode('opencode v2.0.31'))).toMatch(
      /runs opencode 2\.0\.31, but Bugpatrol supports only opencode 1\.x/,
    );
  });

  it('refuses an opencode whose version it cannot read', async () => {
    expect(runtimeProblem('explorer', explorer, await fakeOpencode(undefined))).toMatch(/cannot tell which opencode/);
    expect(runtimeProblem('explorer', explorer, await fakeOpencode('dev'))).toMatch(/supports only opencode 1\.x/);
  });

  it('labels the runtime by its program, past the inline config', () => {
    expect(describeRuntime(explorer)).toBe('cli:opencode');
  });
});
