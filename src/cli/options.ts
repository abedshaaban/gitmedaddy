import type { Command } from 'commander'

export interface GlobalCliOptions {
  json?: boolean
  interactive?: boolean
}

export function getGlobalCliOptions(command: Command): GlobalCliOptions {
  const options = command.optsWithGlobals()
  const resolved: GlobalCliOptions = {}

  if (typeof options.json === 'boolean') {
    resolved.json = options.json
  }

  if (typeof options.interactive === 'boolean') {
    resolved.interactive = options.interactive
  }

  return resolved
}
