import { cloneProject } from '../core/project'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerCloneCommand(program: Command) {
  program
    .command('clone')
    .argument('<repo-url>', 'Git repository URL to clone')
    .description('Clone a Git repository into a workspace-ready project')
    .action(async (repoUrl: string, _options: object, command: Command) => {
      await executeCommand(command, async (behavior) => {
        return cloneProject({
          repoUrl,
          cwd: process.cwd(),
          interactive: behavior.interactive,
          settings: {
            json: behavior.json,
            interactive: behavior.interactive
          }
        })
      })
    })
}
