import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { saveState, withStateLock } from '../../../src/config/save'
import { createTempDir } from '../../helpers/tempDir'

const tempDirs: Array<string> = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('saveState', () => {
  it('writes branches.json inside the state directory', async () => {
    const projectRoot = await createTempDir('save-state')
    tempDirs.push(projectRoot)

    await saveState(projectRoot, {
      defaultBaseBranch: 'main',
      settings: { json: true, interactive: false },
      workspaces: [{ branch: 'main', folderName: 'main', goal: '' }]
    })

    const raw = await fs.readFile(path.join(projectRoot, 'state', 'branches.json'), 'utf8')
    expect(JSON.parse(raw)).toEqual({
      defaultBaseBranch: 'main',
      settings: { json: true, interactive: false },
      workspaces: [{ branch: 'main', folderName: 'main', goal: '' }]
    })
  })
})

describe('withStateLock', () => {
  it('creates and releases the lock file around the callback', async () => {
    const projectRoot = await createTempDir('state-lock')
    tempDirs.push(projectRoot)

    const result = await withStateLock(projectRoot, async () => {
      await expect(fs.access(path.join(projectRoot, 'state', 'branches.lock'))).resolves.toBeUndefined()
      return 'ok'
    })

    expect(result).toBe('ok')
    await expect(fs.access(path.join(projectRoot, 'state', 'branches.lock'))).rejects.toMatchObject({ code: 'ENOENT' })
  })
})
