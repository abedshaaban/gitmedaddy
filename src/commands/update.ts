import { updateDefaultBaseBranch } from '../core/workspace'
import type { Command } from 'commander'

export function registerUpdateCommand(program: Command) {
  program
    .command('update')
    .description('Change the default base branch for new workspaces (interactive)')
    .action(async () => {
      try {
        const result = await updateDefaultBaseBranch({ cwd: process.cwd() })

        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred'

        console.error(message)
        process.exitCode = 1
      }
    })
}
