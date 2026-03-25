import fs from 'node:fs/promises'
import path from 'node:path'
import type { ProjectState } from './types'

const stateDirName = 'state'
const lockFileName = 'branches.lock'
const lockRetryDelayMs = 100
const lockTimeoutMs = 10_000

async function ensureStateDir(projectRoot: string): Promise<string> {
  const stateDir = path.join(projectRoot, stateDirName)
  await fs.mkdir(stateDir, { recursive: true })
  return stateDir
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function acquireStateLock(projectRoot: string): Promise<() => Promise<void>> {
  const stateDir = await ensureStateDir(projectRoot)
  const lockPath = path.join(stateDir, lockFileName)
  const startedAt = Date.now()

  for (;;) {
    try {
      const handle = await fs.open(lockPath, 'wx')
      await handle.writeFile(`${process.pid}\n`, 'utf8')
      await handle.close()

      return async () => {
        await fs.unlink(lockPath).catch((error: unknown) => {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error
          }
        })
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error
      }
    }

    if (Date.now() - startedAt >= lockTimeoutMs) {
      throw new Error('timed out waiting for state lock')
    }

    await sleep(lockRetryDelayMs)
  }
}

export async function withStateLock<T>(projectRoot: string, fn: () => Promise<T>): Promise<T> {
  const release = await acquireStateLock(projectRoot)

  try {
    return await fn()
  } finally {
    await release()
  }
}

export async function saveState(projectRoot: string, state: ProjectState): Promise<void> {
  const stateDir = await ensureStateDir(projectRoot)
  const statePath = path.join(stateDir, 'branches.json')
  const tempPath = path.join(stateDir, `branches.${process.pid}.${Date.now()}.tmp`)

  await fs.writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  await fs.rename(tempPath, statePath)
}
