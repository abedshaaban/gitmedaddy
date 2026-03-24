import { mergeWorkspace } from '../core/workspace'
import type { Command } from 'commander'

export function registerMergeCommand(program: Command) {
  program
    .command('merge')
    .option('--from <source-branch>', 'Branch to merge from')
    .option('--to <target-branch>', 'Branch to merge into')
    .description('Merge source branch into a target displayed workspace branch')
    .action(async (options: { from?: string | undefined; to?: string | undefined }) => {
      try {
        const result = await mergeWorkspace({
          cwd: process.cwd(),
          fromBranch: options.from,
          toBranch: options.to
        })

        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred'

        console.error(message)
        process.exitCode = 1
      }
    })
}
