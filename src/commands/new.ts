import { createNewWorkspace } from '../core/workspace'
import { branchToFolderSlug } from '../utils/slug'
import { promptInput } from '../utils/prompt'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerNewCommand(program: Command) {
  program
    .command('new')
    .alias('n')
    .argument('<branch-name>', 'Name of the new workspace branch')
    .option('-f, --from <base-branch>', 'Base branch to create the workspace from')
    .description('Create a new workspace for a branch')
    .action(async (branchName: string, options: { from?: string | undefined }, command: Command) => {
      await executeCommand(command, async (behavior) => {
        const defaultFolderName = branchToFolderSlug(branchName)
        const folderName = behavior.interactive
          ? await promptInput('Workspace folder name', defaultFolderName)
          : defaultFolderName
        const goal = behavior.interactive ? await promptInput('Goal (optional)', '') : ''

        return createNewWorkspace({
          branchName,
          baseBranchOverride: options.from,
          folderName,
          goal,
          cwd: process.cwd()
        })
      })
    })
}
