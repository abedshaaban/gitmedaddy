import type { Command } from 'commander'
import { pullWorkspaces } from '../core/workspace'

export function registerPullCommand(program: Command) {
  program
    .command('pull')
    .option('-a, --all', 'Pull all displayed branches')
    .description('Pull latest changes in displayed workspace branch(es)')
    .action(async (options: { all?: boolean | undefined }) => {
      try {
        const result = await pullWorkspaces({
          cwd: process.cwd(),
          all: options.all ?? false
        })
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred'
        // eslint-disable-next-line no-console
        console.error(message)
        process.exitCode = 1
      }
    })
}
