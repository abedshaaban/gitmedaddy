import type { Command } from 'commander'
import { setWorkspaceGoal } from '../core/workspace'

export function registerSetGoalCommand(program: Command) {
  program
    .command('setgoal')
    .argument('<goal>', 'Goal text for the branch')
    .argument('[branch-name]', 'Visible branch name (defaults to current workspace branch)')
    .description('Set goal for a visible workspace branch')
    .action(async (goal: string, branchName?: string) => {
      try {
        const result = await setWorkspaceGoal({
          cwd: process.cwd(),
          goal,
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
