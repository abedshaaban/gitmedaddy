export interface WorkspaceEntry {
  branch: string
  folderName: string
  goal: string
}

export interface ProjectState {
  defaultBaseBranch: string
  workspaces: Array<WorkspaceEntry>
}
