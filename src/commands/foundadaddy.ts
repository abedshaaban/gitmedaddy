import { foundADaddy } from '../core/foundadaddy'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerFoundADaddyCommand(program: Command) {
  program
    .command('foundadaddy')
    .description('Initialize gmd in an existing Git repository')
    .action(async (_options: object, command: Command) => {
      await executeCommand(command, async (behavior) => {
        return foundADaddy({
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
