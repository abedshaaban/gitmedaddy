import { describe, expect, it } from 'vitest'
import { branchToFolderSlug, resolveSlugCollision } from '../../../src/utils/slug'

describe('branchToFolderSlug', () => {
  it('replaces separators and unsafe characters', () => {
    expect(branchToFolderSlug('feature/new thing')).toBe('feature-new-thing')
  })

  it('collapses repeated separators and trims edges', () => {
    expect(branchToFolderSlug('///feature///demo***')).toBe('feature-demo')
  })

  it('falls back to workspace when the slug is empty', () => {
    expect(branchToFolderSlug('////')).toBe('workspace')
  })
})

describe('resolveSlugCollision', () => {
  it('returns the desired slug when unused', () => {
    expect(resolveSlugCollision('feature-demo', new Set(['main']))).toBe('feature-demo')
  })

  it('appends the first available suffix when there is a collision', () => {
    expect(resolveSlugCollision('feature-demo', new Set(['feature-demo', 'feature-demo-a']))).toBe('feature-demo-b')
  })

  it('throws when no suffixes remain', () => {
    const occupied = new Set(['feature-demo'])
    for (const suffix of 'abcdefghijklmnopqrstuvwxyz0123456789') {
      occupied.add(`feature-demo-${suffix}`)
    }

    expect(() => resolveSlugCollision('feature-demo', occupied)).toThrow('slug collision could not be resolved')
  })
})
