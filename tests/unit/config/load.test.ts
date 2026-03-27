import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadState } from '../../../src/config/load'
import { createTempDir } from '../../helpers/tempDir'

const tempDirs: Array<string> = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('loadState', () => {
  it('loads a valid state file as-is', async () => {
    const projectRoot = await createTempDir('load-state')
    tempDirs.push(projectRoot)

    await fs.mkdir(path.join(projectRoot, 'state'))
    await fs.writeFile(
      path.join(projectRoot, 'state', 'branches.json'),
      JSON.stringify({
        defaultBaseBranch: 'develop',
        settings: { json: false, interactive: false },
        workspaces: [{ branch: 'develop', folderName: 'develop', goal: 'Ship it' }]
      }),
      'utf8'
    )

    await expect(loadState(projectRoot)).resolves.toEqual({
      defaultBaseBranch: 'develop',
      settings: { json: false, interactive: false },
      workspaces: [{ branch: 'develop', folderName: 'develop', goal: 'Ship it' }]
    })
  })

  it('fills defaults and normalizes legacy workspace fields', async () => {
    const projectRoot = await createTempDir('load-state-normalize')
    tempDirs.push(projectRoot)

    await fs.mkdir(path.join(projectRoot, 'state'))
    await fs.writeFile(
      path.join(projectRoot, 'state', 'branches.json'),
      JSON.stringify({
        workspaces: [
          { branch: 'main', folder: 'main-folder' },
          { branch: 'feature/demo', path: 'feature-demo', goal: 42 }
        ]
      }),
      'utf8'
    )

    await expect(loadState(projectRoot)).resolves.toEqual({
      defaultBaseBranch: 'main',
      settings: { json: true, interactive: true },
      workspaces: [
        { branch: 'main', folderName: 'main-folder', goal: '' },
        { branch: 'feature/demo', folderName: 'feature-demo', goal: '42' }
      ]
    })
  })
})
