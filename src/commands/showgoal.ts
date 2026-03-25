import { showWorkspaceGoal } from '../core/workspace'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerShowGoalCommand(program: Command) {
  program
    .command('showgoal')
    .argument('[branch-name]', 'Visible branch name (defaults to current workspace branch)')
    .description('Show goal for a visible workspace branch')
    .action(async (branchName: string | undefined, _options: object, command: Command) => {
      await executeCommand(command, async () => {
        return showWorkspaceGoal({
          cwd: process.cwd(),
          branchName
        })
      })
    })
}
