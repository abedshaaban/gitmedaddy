import path from 'node:path'
import fs from 'node:fs'

function isGmdProjectDir(dir: string): boolean {
  const stateBranches = path.join(dir, 'state', 'branches.json')
  return fs.existsSync(stateBranches)
}

export function findProjectRoot(startDir: string): string | null {
  let current = path.resolve(startDir)

  // Walk upwards until we find state/branches.json.
  for (;;) {
    if (isGmdProjectDir(current)) {
      return current
    }

    const parent = path.dirname(current)
    if (parent === current) {
      return null
    }

    current = parent
  }
}
