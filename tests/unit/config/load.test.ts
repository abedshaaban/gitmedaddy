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

  it('throws when the state file is missing', async () => {
    const projectRoot = await createTempDir('load-state-missing')
    tempDirs.push(projectRoot)

    await expect(loadState(projectRoot)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('throws when the state file contains malformed json', async () => {
    const projectRoot = await createTempDir('load-state-malformed')
    tempDirs.push(projectRoot)

    await fs.mkdir(path.join(projectRoot, 'state'))
    await fs.writeFile(path.join(projectRoot, 'state', 'branches.json'), '{not-json', 'utf8')

    await expect(loadState(projectRoot)).rejects.toBeInstanceOf(SyntaxError)
  })

  it('normalizes null settings and null workspaces', async () => {
    const projectRoot = await createTempDir('load-state-nullish')
    tempDirs.push(projectRoot)

    await fs.mkdir(path.join(projectRoot, 'state'))
    await fs.writeFile(
      path.join(projectRoot, 'state', 'branches.json'),
      JSON.stringify({
        defaultBaseBranch: 123,
        settings: null,
        workspaces: null
      }),
      'utf8'
    )

    await expect(loadState(projectRoot)).resolves.toEqual({
      defaultBaseBranch: 'main',
      settings: { json: true, interactive: true },
      workspaces: []
    })
  })

  it('falls back to main when the default base branch is blank', async () => {
    const projectRoot = await createTempDir('load-state-blank-branch')
    tempDirs.push(projectRoot)

    await fs.mkdir(path.join(projectRoot, 'state'))
    await fs.writeFile(
      path.join(projectRoot, 'state', 'branches.json'),
      JSON.stringify({
        defaultBaseBranch: '   ',
        settings: { json: false, interactive: false },
        workspaces: []
      }),
      'utf8'
    )

    await expect(loadState(projectRoot)).resolves.toEqual({
      defaultBaseBranch: 'main',
      settings: { json: false, interactive: false },
      workspaces: []
    })
  })
})
