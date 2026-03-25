import { resolveCliBehavior } from '../cli/behavior'
import { getGlobalCliOptions } from '../cli/options'
import { printError, printResult } from '../cli/output'
import type { Command } from 'commander'
import type { CliBehavior } from '../cli/behavior'

export async function executeCommand(
  command: Command,
  run: (behavior: CliBehavior) => Promise<unknown>
): Promise<void> {
  let behavior: CliBehavior = { json: true, interactive: false }

  try {
    behavior = await resolveCliBehavior(process.cwd(), getGlobalCliOptions(command))
    const result = await run(behavior)
    if (result !== undefined) {
      printResult(result, behavior)
    }
  } catch (error) {
    printError(error, behavior)
    process.exitCode = 1
  }
}
