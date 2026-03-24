import fs from 'node:fs/promises'
import path from 'node:path'
import type { ProjectState } from './types'

const stateDirName = 'state'

async function ensureStateDir(projectRoot: string): Promise<string> {
  const stateDir = path.join(projectRoot, stateDirName)
  await fs.mkdir(stateDir, { recursive: true })
  return stateDir
}

export async function saveState(projectRoot: string, state: ProjectState): Promise<void> {
  const stateDir = await ensureStateDir(projectRoot)
  const statePath = path.join(stateDir, 'branches.json')
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}
