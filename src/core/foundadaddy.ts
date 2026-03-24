import fs from 'node:fs/promises'
import path from 'node:path'
import { git } from '../git/exec'
import { createWorktree, detectDefaultBranch, ensureLocalBranch, fetchLatest, listRemoteBranches } from '../git/repo'
import { saveConfig, saveState } from '../config/save'
import type { ProjectConfig, ProjectState } from '../config/types'
import { promptSelect } from '../utils/prompt'
import { branchToFolderSlug } from '../utils/slug'

export interface FoundADaddyInput {
  cwd: string
}

export interface FoundADaddyResult {
  projectRoot: string
  workspacePath: string
  defaultBaseBranch: string
}

export async function foundADaddy(input: FoundADaddyInput): Promise<FoundADaddyResult> {
  const { cwd } = input

  const { stdout } = await git(['rev-parse', '--show-toplevel'], { cwd })
  const projectRoot = stdout.trim()
  if (!projectRoot) {
    throw new Error('not inside a git repository')
  }

  const gitDir = path.join(projectRoot, '.gmd', 'repo.git')
  try {
    await fs.access(gitDir)
    throw new Error('gmd is already initialized in this repository')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  await git(['clone', '--bare', '.git', gitDir], { cwd: projectRoot })
  await git(['config', 'remote.origin.fetch', '+refs/heads/*:refs/remotes/origin/*'], { gitDir })
  await fetchLatest(gitDir)

  const detectedDefaultBranch = await detectDefaultBranch(gitDir)
  const remoteBranches = await listRemoteBranches(gitDir)
  const preferredDefault = remoteBranches.includes('main')
    ? 'main'
    : (remoteBranches.includes(detectedDefaultBranch) ? detectedDefaultBranch : remoteBranches[0]!)

  const defaultBaseBranch = await promptSelect(
    'Select your default base branch for new workspaces',
    remoteBranches,
    preferredDefault
  )

  await ensureLocalBranch(gitDir, defaultBaseBranch, defaultBaseBranch, true)

  const workspaceFolderName = branchToFolderSlug(defaultBaseBranch)
  const workspacePath = path.join(projectRoot, workspaceFolderName)
  try {
    await fs.mkdir(workspacePath, { recursive: false })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`workspace folder "${workspaceFolderName}" already exists`)
    }
    throw error
  }

  await createWorktree(gitDir, workspacePath, defaultBaseBranch)

  const projectName = path.basename(projectRoot)
  const config: ProjectConfig = {
    version: 1,
    projectName,
    remote: 'origin',
    defaultBaseBranch
  }
  const state: ProjectState = {
    defaultBaseBranch,
    workspaces: [
      {
        branch: defaultBaseBranch,
        folderName: workspaceFolderName,
        goal: ''
      }
    ]
  }

  await saveConfig(projectRoot, config)
  await saveState(projectRoot, state)

  return {
    projectRoot,
    workspacePath,
    defaultBaseBranch
  }
}
