import { loadState } from '../config/load'
import { DEFAULT_PROJECT_SETTINGS } from '../config/types'
import { findProjectRoot } from '../utils/findProjectRoot'
import type { GlobalCliOptions } from './options'

export interface CliBehavior {
  json: boolean
  interactive: boolean
}

export function supportsInteractiveCli(): boolean {
  return process.stdin.isTTY === true && process.stdout.isTTY === true
}

export function resolveFallbackCliBehavior(overrides: GlobalCliOptions = {}): CliBehavior {
  const desiredInteractive = overrides.interactive ?? DEFAULT_PROJECT_SETTINGS.interactive

  return {
    json: overrides.json ?? DEFAULT_PROJECT_SETTINGS.json,
    interactive: desiredInteractive && supportsInteractiveCli()
  }
}

export async function resolveCliBehavior(cwd: string, overrides: GlobalCliOptions = {}): Promise<CliBehavior> {
  const projectRoot = findProjectRoot(cwd)
  const settings = projectRoot ? (await loadState(projectRoot)).settings : DEFAULT_PROJECT_SETTINGS

  const desiredInteractive = overrides.interactive ?? settings.interactive

  return {
    json: overrides.json ?? settings.json,
    interactive: desiredInteractive && supportsInteractiveCli()
  }
}
