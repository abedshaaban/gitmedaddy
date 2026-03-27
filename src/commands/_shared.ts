import { resolveCliBehavior, resolveFallbackCliBehavior } from '../cli/behavior'
import { InvalidProjectStateError } from '../config/errors'
import { repairInvalidProjectState } from '../config/repair'
import { getGlobalCliOptions } from '../cli/options'
import { printError, printResult } from '../cli/output'
import type { Command } from 'commander'
import type { CliBehavior } from '../cli/behavior'

export async function executeCommand(
  command: Command,
  run: (behavior: CliBehavior) => Promise<unknown>
): Promise<void> {
  const overrides = getGlobalCliOptions(command)
  let behavior: CliBehavior = resolveFallbackCliBehavior(overrides)

  try {
    behavior = await resolveCliBehavior(process.cwd(), overrides)
    const result = await run(behavior)
    if (result !== undefined) {
      printResult(result, behavior)
    }
  } catch (error) {
    if (error instanceof InvalidProjectStateError) {
      const repaired = await repairInvalidProjectState(error, behavior.interactive)
      if (repaired) {
        try {
          behavior = await resolveCliBehavior(process.cwd(), overrides)
          const result = await run(behavior)
          if (result !== undefined) {
            printResult(result, behavior)
          }
          return
        } catch (retryError) {
          printError(retryError, behavior)
          process.exitCode = 1
          return
        }
      }
    }

    printError(error, behavior)
    process.exitCode = 1
  }
}
