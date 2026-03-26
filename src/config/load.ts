import fs from 'node:fs/promises'
import path from 'node:path'
import { DEFAULT_PROJECT_SETTINGS } from './types'
import type { ProjectState } from './types'

function normalizeWorkspaces(parsed: Partial<ProjectState>): ProjectState['workspaces'] {
  const rawEntries = Array.isArray(parsed.workspaces) ? parsed.workspaces : []

  return rawEntries.map((entry) => {
    const record = entry as unknown as Record<string, unknown>
    return {
      branch: String(record.branch ?? ''),
      folderName: String(record.folderName ?? record.folder ?? record.path ?? ''),
      goal: String(record.goal ?? '')
    }
  })
}

function normalizeSettings(parsed: Partial<ProjectState>): ProjectState['settings'] {
  const record = (parsed.settings ?? {}) as Partial<ProjectState['settings']>

  return {
    json: typeof record.json === 'boolean' ? record.json : DEFAULT_PROJECT_SETTINGS.json,
    interactive: typeof record.interactive === 'boolean' ? record.interactive : DEFAULT_PROJECT_SETTINGS.interactive
  }
}

export async function loadState(projectRoot: string): Promise<ProjectState> {
  const branchesStatePath = path.join(projectRoot, 'state', 'branches.json')
  const raw = await fs.readFile(branchesStatePath, 'utf8')
  const parsed = JSON.parse(raw) as Partial<ProjectState>

  return {
    defaultBaseBranch: parsed.defaultBaseBranch ?? 'main',
    settings: normalizeSettings(parsed),
    workspaces: normalizeWorkspaces(parsed)
  }
}
