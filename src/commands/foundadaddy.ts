import type { Command } from 'commander'
import { foundADaddy } from '../core/foundadaddy'

export function registerFoundADaddyCommand(program: Command) {
  program
    .command('foundadaddy')
    .description('Initialize gmd in an existing Git repository')
    .action(async () => {
      try {
        const result = await foundADaddy({ cwd: process.cwd() })
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
