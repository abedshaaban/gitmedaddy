import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { findProjectRoot } from '../../../src/utils/findProjectRoot'
import { createTempDir } from '../../helpers/tempDir'

const tempDirs: Array<string> = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('findProjectRoot', () => {
  it('returns the nearest ancestor containing state/branches.json', async () => {
    const root = await createTempDir('find-project-root')
    tempDirs.push(root)

    const nested = path.join(root, 'feature', 'src')
    await fs.mkdir(path.join(root, 'state'), { recursive: true })
    await fs.writeFile(path.join(root, 'state', 'branches.json'), '{}', 'utf8')
    await fs.mkdir(nested, { recursive: true })

    expect(findProjectRoot(nested)).toBe(root)
  })

  it('returns null when outside a project', async () => {
    const root = await createTempDir('find-project-root-empty')
    tempDirs.push(root)

    expect(findProjectRoot(root)).toBeNull()
  })
})
