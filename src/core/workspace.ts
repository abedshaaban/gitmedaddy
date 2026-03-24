import fs from 'node:fs/promises'
import path from 'node:path'
import { findProjectRoot } from '../utils/findProjectRoot'
import { loadState } from '../config/load'
import { saveState } from '../config/save'
import type { ProjectState } from '../config/types'
import { branchToFolderSlug, resolveSlugCollision } from '../utils/slug'
import {
  fetchLatest,
  ensureBaseBranchExists,
  ensureLocalBranch,
  createWorktree,
  remoteBranchExists,
  localBranchExists,
  syncLocalBranchToRemote,
  removeWorktree
} from '../git/repo'
import { git } from '../git/exec'

export interface CreateNewWorkspaceInput {
  branchName: string
  baseBranchOverride?: string | undefined
  folderName?: string | undefined
  goal?: string | undefined
  cwd: string
}

export interface CreateNewWorkspaceResult {
  projectRoot: string
  workspacePath: string
  branch: string
  baseBranch: string
  usedExistingRemoteBranch: boolean
}

export interface ShowWorkspaceInput {
  branchName: string
  folderName?: string | undefined
  cwd: string
}

export interface ShowWorkspaceResult {
  projectRoot: string
  workspacePath: string
  branch: string
  usedRemoteBranch: boolean
}

export interface HideWorkspaceInput {
  branchName: string
  cwd: string
}

export interface HideWorkspaceResult {
  projectRoot: string
  workspacePath: string
  branch: string
}

export interface CleanWorkspacesInput {
  cwd: string
  keepBranch?: string | undefined
}

export interface CleanWorkspacesResult {
  projectRoot: string
  keptBranch: string
  removedBranches: string[]
}

export interface PullWorkspacesInput {
  cwd: string
  all?: boolean | undefined
}

export interface PullWorkspacesResult {
  projectRoot: string
  pulledBranches: string[]
  failedBranches: Array<{ branch: string; error: string }>
}

export interface MergeWorkspaceInput {
  cwd: string
  fromBranch?: string | undefined
  toBranch?: string | undefined
}

export interface MergeWorkspaceResult {
  projectRoot: string
  sourceBranch: string
  targetBranch: string
}

function resolveCurrentWorkspaceBranch(projectRoot: string, cwd: string, state: ProjectState): string | null {
  const absoluteCwd = path.resolve(cwd)
  for (const workspace of state.workspaces) {
    const workspaceRoot = path.join(projectRoot, workspace.folderName)
    const relative = path.relative(workspaceRoot, absoluteCwd)
    if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
      return workspace.branch
    }
  }
  return null
}

function getWorkspacePath(projectRoot: string, state: ProjectState, branch: string): string {
  const workspace = state.workspaces.find((w) => w.branch === branch)
  if (!workspace) {
    throw new Error(`branch "${branch}" is not currently displayed`)
  }
  return path.join(projectRoot, workspace.folderName)
}

/**
 * Creates a workspace for the requested branch.
 *
 * Flow:
 * 1) Resolve project root and load `state/branches.json`.
 * 2) Fetch latest refs from origin before any branch checks.
 * 3) If target branch exists on origin, use it locally; otherwise create it from base branch.
 * 4) Create a new worktree folder for the branch.
 * 5) Persist the new workspace entry back into state.
 */
export async function createNewWorkspace(input: CreateNewWorkspaceInput): Promise<CreateNewWorkspaceResult> {
  const { branchName, baseBranchOverride, folderName, goal, cwd } = input

  const projectRoot = findProjectRoot(cwd)
  if (!projectRoot) {
    throw new Error('not inside a gitmedaddy project')
  }

  const state = await loadState(projectRoot)

  const baseBranch = baseBranchOverride ?? state.defaultBaseBranch

  const gitDir = path.join(projectRoot, '.gmd', 'repo.git')

  await fetchLatest(gitDir)
  await ensureBaseBranchExists(gitDir, baseBranch)
  const usedExistingRemoteBranch = await remoteBranchExists(gitDir, branchName)
  if (!usedExistingRemoteBranch) {
    // Keep the selected base branch in sync with origin before branching.
    await syncLocalBranchToRemote(gitDir, baseBranch)
  }

  const desiredFolderName = folderName ? branchToFolderSlug(folderName) : branchToFolderSlug(branchName)
  const existingFolderNames = new Set(state.workspaces.map((w) => w.folderName))
  const resolvedFolderName = resolveSlugCollision(desiredFolderName, existingFolderNames)

  const existingBranch = state.workspaces.find((w) => w.branch === branchName)
  if (existingBranch) {
    throw new Error('branch already exists in a conflicting way')
  }

  const workspaceDir = path.join(projectRoot, resolvedFolderName)
  try {
    await fs.mkdir(workspaceDir, { recursive: false })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error('workspace folder already exists')
    }
    throw error
  }

  await ensureLocalBranch(gitDir, branchName, baseBranch, !usedExistingRemoteBranch)
  await createWorktree(gitDir, workspaceDir, branchName)

  const newEntry = {
    branch: branchName,
    folderName: resolvedFolderName,
    goal: (goal ?? '').trim()
  }

  const newState: ProjectState = {
    defaultBaseBranch: state.defaultBaseBranch,
    workspaces: [...state.workspaces, newEntry]
  }

  await saveState(projectRoot, newState)

  return {
    projectRoot,
    workspacePath: workspaceDir,
    branch: branchName,
    baseBranch,
    usedExistingRemoteBranch
  }
}

export async function showWorkspace(input: ShowWorkspaceInput): Promise<ShowWorkspaceResult> {
  const { branchName, folderName, cwd } = input

  const projectRoot = findProjectRoot(cwd)
  if (!projectRoot) {
    throw new Error('not inside a gitmedaddy project')
  }

  const state = await loadState(projectRoot)
  const existingBranch = state.workspaces.find((w) => w.branch === branchName)
  if (existingBranch) {
    throw new Error('branch is already displayed')
  }

  const gitDir = path.join(projectRoot, '.gmd', 'repo.git')
  await fetchLatest(gitDir)

  const hasRemoteBranch = await remoteBranchExists(gitDir, branchName)
  const hasLocalBranch = await localBranchExists(gitDir, branchName)
  if (!hasRemoteBranch && !hasLocalBranch) {
    throw new Error('branch was not found on origin or local refs')
  }

  if (hasRemoteBranch) {
    await syncLocalBranchToRemote(gitDir, branchName)
  }

  const desiredFolderName = folderName ? branchToFolderSlug(folderName) : branchToFolderSlug(branchName)
  const existingFolderNames = new Set(state.workspaces.map((w) => w.folderName))
  const resolvedFolderName = resolveSlugCollision(desiredFolderName, existingFolderNames)
  const workspaceDir = path.join(projectRoot, resolvedFolderName)

  try {
    await fs.mkdir(workspaceDir, { recursive: false })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error('workspace folder already exists')
    }
    throw error
  }

  await createWorktree(gitDir, workspaceDir, branchName)

  const newEntry = {
    branch: branchName,
    folderName: resolvedFolderName,
    goal: ''
  }

  const newState: ProjectState = {
    defaultBaseBranch: state.defaultBaseBranch,
    workspaces: [...state.workspaces, newEntry]
  }
  await saveState(projectRoot, newState)

  return {
    projectRoot,
    workspacePath: workspaceDir,
    branch: branchName,
    usedRemoteBranch: hasRemoteBranch
  }
}

export async function hideWorkspace(input: HideWorkspaceInput): Promise<HideWorkspaceResult> {
  const { branchName, cwd } = input

  const projectRoot = findProjectRoot(cwd)
  if (!projectRoot) {
    throw new Error('not inside a gitmedaddy project')
  }

  const state = await loadState(projectRoot)
  const entry = state.workspaces.find((w) => w.branch === branchName)
  if (!entry) {
    throw new Error('branch is not currently displayed')
  }

  const gitDir = path.join(projectRoot, '.gmd', 'repo.git')
  const workspaceDir = path.join(projectRoot, entry.folderName)
  await removeWorktree(gitDir, workspaceDir)

  const newState: ProjectState = {
    defaultBaseBranch: state.defaultBaseBranch,
    workspaces: state.workspaces.filter((w) => w.branch !== branchName)
  }
  await saveState(projectRoot, newState)

  return {
    projectRoot,
    workspacePath: workspaceDir,
    branch: branchName
  }
}

export async function cleanWorkspaces(input: CleanWorkspacesInput): Promise<CleanWorkspacesResult> {
  const { cwd, keepBranch } = input

  const projectRoot = findProjectRoot(cwd)
  if (!projectRoot) {
    throw new Error('not inside a gitmedaddy project')
  }

  const gitDir = path.join(projectRoot, '.gmd', 'repo.git')
  await fetchLatest(gitDir)

  const initialState = await loadState(projectRoot)
  const targetKeepBranch = keepBranch ?? initialState.defaultBaseBranch

  const isDisplayed = initialState.workspaces.some((w) => w.branch === targetKeepBranch)
  if (!isDisplayed) {
    await showWorkspace({
      branchName: targetKeepBranch,
      cwd
    })
  }

  const state = await loadState(projectRoot)
  const removedBranches: string[] = []

  for (const workspace of state.workspaces) {
    if (workspace.branch === targetKeepBranch) continue
    const workspaceDir = path.join(projectRoot, workspace.folderName)
    await removeWorktree(gitDir, workspaceDir)
    removedBranches.push(workspace.branch)
  }

  const keptWorkspace = state.workspaces.find((w) => w.branch === targetKeepBranch)
  if (!keptWorkspace) {
    throw new Error('keep branch is missing from workspaces')
  }

  const newState: ProjectState = {
    defaultBaseBranch: state.defaultBaseBranch,
    workspaces: [keptWorkspace]
  }
  await saveState(projectRoot, newState)

  return {
    projectRoot,
    keptBranch: targetKeepBranch,
    removedBranches
  }
}

export async function pullWorkspaces(input: PullWorkspacesInput): Promise<PullWorkspacesResult> {
  const { cwd, all = false } = input

  const projectRoot = findProjectRoot(cwd)
  if (!projectRoot) {
    throw new Error('not inside a gitmedaddy project')
  }

  const gitDir = path.join(projectRoot, '.gmd', 'repo.git')
  await fetchLatest(gitDir)

  const state = await loadState(projectRoot)
  const branches = all
    ? state.workspaces.map((w) => w.branch)
    : (() => {
        const currentBranch = resolveCurrentWorkspaceBranch(projectRoot, cwd, state)
        if (!currentBranch) {
          throw new Error('current directory is not inside a displayed workspace')
        }
        return [currentBranch]
      })()

  const pulledBranches: string[] = []
  const failedBranches: Array<{ branch: string; error: string }> = []

  for (const branch of branches) {
    const workspacePath = getWorkspacePath(projectRoot, state, branch)
    try {
      await git(['pull', 'origin', branch], { cwd: workspacePath })
      pulledBranches.push(branch)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      failedBranches.push({ branch, error: message })
    }
  }

  return {
    projectRoot,
    pulledBranches,
    failedBranches
  }
}

export async function mergeWorkspace(input: MergeWorkspaceInput): Promise<MergeWorkspaceResult> {
  const { cwd, fromBranch, toBranch } = input

  const projectRoot = findProjectRoot(cwd)
  if (!projectRoot) {
    throw new Error('not inside a gitmedaddy project')
  }

  const state = await loadState(projectRoot)
  const currentBranch = resolveCurrentWorkspaceBranch(projectRoot, cwd, state)

  const targetBranch = toBranch ?? currentBranch
  if (!targetBranch) {
    throw new Error('current directory is not inside a displayed workspace')
  }

  const sourceBranch = fromBranch ?? state.defaultBaseBranch
  const gitDir = path.join(projectRoot, '.gmd', 'repo.git')

  await fetchLatest(gitDir)
  await ensureBaseBranchExists(gitDir, sourceBranch)
  await syncLocalBranchToRemote(gitDir, sourceBranch)

  const targetPath = getWorkspacePath(projectRoot, state, targetBranch)
  if (!fromBranch) {
    await git(['pull', 'origin', sourceBranch], { cwd: targetPath })
  } else {
    await git(['merge', sourceBranch], { cwd: targetPath })
  }

  return {
    projectRoot,
    sourceBranch,
    targetBranch
  }
}
