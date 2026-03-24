import type { Command } from 'commander'
import { showWorkspaceGoal } from '../core/workspace'

export function registerShowGoalCommand(program: Command) {
  program
    .command('showgoal')
    .argument('[branch-name]', 'Visible branch name (defaults to current workspace branch)')
    .description('Show goal for a visible workspace branch')
    .action(async (branchName?: string) => {
      try {
        const result = await showWorkspaceGoal({
          cwd: process.cwd(),
          branchName
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
