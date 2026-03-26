import { pullWorkspaces } from '../core/workspace'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerPullCommand(program: Command) {
  program
    .command('pull')
    .option('-a, --all', 'Pull all displayed branches')
    .description('Pull latest changes in displayed workspace branch(es)')
    .action(async (options: { all?: boolean | undefined }, command: Command) => {
      await executeCommand(command, async () => {
        return pullWorkspaces({
          cwd: process.cwd(),
          all: options.all ?? false
        })
      })
    })
}
