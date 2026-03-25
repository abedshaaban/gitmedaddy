import { mergeWorkspace } from '../core/workspace'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerMergeCommand(program: Command) {
  program
    .command('merge')
    .option('--from <source-branch>', 'Branch to merge from')
    .option('--to <target-branch>', 'Branch to merge into')
    .description('Merge source branch into a target displayed workspace branch')
    .action(async (options: { from?: string | undefined; to?: string | undefined }, command: Command) => {
      await executeCommand(command, async () => {
        return mergeWorkspace({
          cwd: process.cwd(),
          fromBranch: options.from,
          toBranch: options.to
        })
      })
    })
}
