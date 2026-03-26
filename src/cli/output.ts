import util from 'node:util'
import type { CliBehavior } from './behavior'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error occurred'
}

export function printResult(result: unknown, behavior: CliBehavior): void {
  if (behavior.json) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log(util.inspect(result, { depth: null, colors: process.stdout.isTTY === true }))
}

export function printError(error: unknown, behavior: CliBehavior): void {
  const message = getErrorMessage(error)

  if (behavior.json) {
    console.error(JSON.stringify({ error: message }, null, 2))
    return
  }

  console.error(message)
}

export function printInfo(message: string, behavior: CliBehavior): void {
  if (behavior.json) {
    console.error(message)
    return
  }

  console.log(message)
}
