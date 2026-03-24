import { loadState } from '../config/load'
import { cleanWorkspaces } from '../core/workspace'
import { findProjectRoot } from '../utils/findProjectRoot'
import { promptSelect } from '../utils/prompt'
import type { Command } from 'commander'

export function registerCleanCommand(program: Command) {
  program
    .command('clean')
    .alias('c')
    .option('-f, --from <branch-name>', 'Branch to keep displayed after clean')
    .description('Remove all displayed workspaces except one kept branch')
    .action(async (options: { from?: string | undefined }) => {
      try {
        let keepBranch = options.from

        if (!keepBranch) {
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

        const result = await cleanWorkspaces({
          cwd: process.cwd(),
          keepBranch
        })

        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred'

        console.error(message)
        process.exitCode = 1
      }
    })
}
