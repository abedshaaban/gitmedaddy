import { loadState } from '../config/load'
import { cleanWorkspaces } from '../core/workspace'
import { findProjectRoot } from '../utils/findProjectRoot'
import { promptSelect } from '../utils/prompt'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerCleanCommand(program: Command) {
  program
    .command('clean')
    .alias('c')
    .option('-f, --from <branch-name>', 'Branch to keep displayed after clean')
    .description('Remove all displayed workspaces except one kept branch')
    .action(async (options: { from?: string | undefined }, command: Command) => {
      await executeCommand(command, async (behavior) => {
        let keepBranch = options.from

        if (!keepBranch) {
          if (!behavior.interactive) {
            throw new Error('branch name is required when interactive mode is disabled')
          }

          const projectRoot = findProjectRoot(process.cwd())
          if (!projectRoot) {
            throw new Error('not inside a gitmedaddy project')
          }

          const state = await loadState(projectRoot)
          const optionSet = new Set<string>(state.workspaces.map((w) => w.branch))
          optionSet.add(state.defaultBaseBranch)
          const choices = Array.from(optionSet)
          keepBranch = await promptSelect('Select the branch to keep displayed', choices, state.defaultBaseBranch)
        }

        return cleanWorkspaces({
          cwd: process.cwd(),
          keepBranch
        })
      })
    })
}
