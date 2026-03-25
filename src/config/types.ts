export interface ProjectSettings {
  json: boolean
  interactive: boolean
}

export interface WorkspaceEntry {
  branch: string
  folderName: string
  goal: string
}

export interface ProjectState {
  defaultBaseBranch: string
  settings: ProjectSettings
  workspaces: Array<WorkspaceEntry>
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  json: true,
  interactive: true
}
