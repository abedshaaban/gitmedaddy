import { showWorkspaceGoal } from '../core/workspace'
import type { Command } from 'commander'

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

        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred'

        console.error(message)
        process.exitCode = 1
      }
    })
}
