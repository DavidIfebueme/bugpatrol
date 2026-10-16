import { execFileSync } from 'node:child_process';
import type { AgentRole } from '@bugpatrol/core';

/**
 * Says why the installed opencode cannot run a role, or undefined when it can.
 * The presets target 1.x. 2.x (`@opencode/cli`, checked on 2.0.31) rejects
 * `--pure`, and the first turn of `opencode run` does not see MCP tools: they
 * register after the session takes its tool snapshot. Retire this check when
 * a 2.x preset reaches the Bugpatrol tools on its first turn.
 */
export function opencodeProblem(role: AgentRole, program: string, env: NodeJS.ProcessEnv): string | undefined {
  let version: string;
  try {
    version = execFileSync(program, ['--version'], { env, timeout: 5000, encoding: 'utf8' }).trim();
  } catch {
    return `The ${role} runs opencode, but \`${program} --version\` failed, so Bugpatrol cannot tell which opencode this is.`;
  }
  const semver = version.match(/(\d+)\.\d+\.\d+/);
  if (semver?.[1] === '1') return undefined;
  return `The ${role} runs opencode ${semver?.[0] ?? `"${version}"`}, but Bugpatrol supports only opencode 1.x. Install it with \`npm i -g opencode-ai@1\`, or set agents.${role}.use.`;
}
