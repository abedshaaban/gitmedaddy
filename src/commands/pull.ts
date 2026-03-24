import { pullWorkspaces } from '../core/workspace'
import type { Command } from 'commander'

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

        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred'

        console.error(message)
        process.exitCode = 1
      }
    })
}
