import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadState } from '../../src/config/load'
import { saveState } from '../../src/config/save'
import { findProjectRoot } from '../../src/utils/findProjectRoot'
import { createTempDir } from '../helpers/tempDir'

const tempDirs: Array<string> = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('config integration', () => {
  it('round-trips state through saveState and loadState', async () => {
    const projectRoot = await createTempDir('config-integration')
    tempDirs.push(projectRoot)

    const state = {
      defaultBaseBranch: 'develop',
      settings: { json: false, interactive: false },
      workspaces: [
        { branch: 'develop', folderName: 'develop', goal: 'Ship it' },
        { branch: 'feature/demo', folderName: 'feature-demo', goal: '' }
      ]
    }

    await saveState(projectRoot, state)

    await expect(loadState(projectRoot)).resolves.toEqual(state)
  })

  it('finds the project root from a nested directory on disk', async () => {
    const projectRoot = await createTempDir('config-integration-root')
    tempDirs.push(projectRoot)

    await saveState(projectRoot, {
      defaultBaseBranch: 'main',
      settings: { json: true, interactive: false },
      workspaces: [{ branch: 'main', folderName: 'main', goal: '' }]
    })

    const nested = path.join(projectRoot, 'main', 'src', 'components')
    await fs.mkdir(nested, { recursive: true })

    expect(findProjectRoot(nested)).toBe(projectRoot)
  })
})
