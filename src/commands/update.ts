import { getGlobalCliOptions } from '../cli/options'
import { updateDefaultBaseBranch } from '../core/workspace'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerUpdateCommand(program: Command) {
  program
    .command('update')
    .option('--base <branch-name>', 'Set the default base branch without prompting')
    .description('Update project defaults for base branch, output mode, and interactivity')
    .action(async (options: { base?: string | undefined }, command: Command) => {
      await executeCommand(command, async (behavior) => {
        const overrides = getGlobalCliOptions(command)

        return updateDefaultBaseBranch({
          cwd: process.cwd(),
          interactive: behavior.interactive,
          baseBranchOverride: options.base,
          settingsOverrides: {
            ...(typeof overrides.json === 'boolean' ? { json: overrides.json } : {}),
            ...(typeof overrides.interactive === 'boolean' ? { interactive: overrides.interactive } : {})
          }
        })
      })
    })
}
