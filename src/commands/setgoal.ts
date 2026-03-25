import { setWorkspaceGoal } from '../core/workspace'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerSetGoalCommand(program: Command) {
  program
    .command('setgoal')
    .argument('<goal>', 'Goal text for the branch')
    .argument('[branch-name]', 'Visible branch name (defaults to current workspace branch)')
    .description('Set goal for a visible workspace branch')
    .action(async (goal: string, branchName: string | undefined, command: Command) => {
      await executeCommand(command, async () => {
        return setWorkspaceGoal({
          cwd: process.cwd(),
          goal,
          branchName
        })
      })
    })
}
