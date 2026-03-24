import path from 'node:path'
import fs from 'node:fs'

function isGmdProjectDir(dir: string): boolean {
  const stateBranches = path.join(dir, 'state', 'branches.json')
  const stateConfig = path.join(dir, 'state', 'config.json')
  const legacyGmdConfig = path.join(dir, '.gmd', 'config.json')
  return (
    fs.existsSync(stateBranches) || fs.existsSync(stateConfig) || fs.existsSync(legacyGmdConfig)
  )
}

export function findProjectRoot(startDir: string): string | null {
  let current = path.resolve(startDir)

  // Walk upwards until we find state/ markers or legacy .gmd/config.json
  // eslint-disable-next-line no-constant-condition
  while (true) {
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
