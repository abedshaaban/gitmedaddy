import { foundADaddy } from '../core/foundadaddy'
import type { Command } from 'commander'

export function registerFoundADaddyCommand(program: Command) {
  program
    .command('foundadaddy')
    .description('Initialize gmd in an existing Git repository')
    .action(async () => {
      try {
        const result = await foundADaddy({ cwd: process.cwd() })

        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred'

        console.error(message)
        process.exitCode = 1
      }
    })
}
