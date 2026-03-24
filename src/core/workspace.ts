import fs from "node:fs/promises";
import path from "node:path";
import { findProjectRoot } from "../utils/findProjectRoot";
import { loadState } from "../config/load";
import { saveState } from "../config/save";
import type { ProjectState } from "../config/types";
import { branchToFolderSlug, resolveSlugCollision } from "../utils/slug";
import {
  fetchLatest,
  ensureBaseBranchExists,
  ensureLocalBranch,
  createWorktree,
  remoteBranchExists,
} from "../git/repo";

export interface CreateNewWorkspaceInput {
  branchName: string;
  baseBranchOverride?: string | undefined;
  cwd: string;
}

export interface CreateNewWorkspaceResult {
  projectRoot: string;
  workspacePath: string;
  branch: string;
  baseBranch: string;
  usedExistingRemoteBranch: boolean;
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
export async function createNewWorkspace(
  input: CreateNewWorkspaceInput,
): Promise<CreateNewWorkspaceResult> {
  const { branchName, baseBranchOverride, cwd } = input;

  const projectRoot = findProjectRoot(cwd);
  if (!projectRoot) {
    throw new Error("not inside a gitmedaddy project");
  }

  const state = await loadState(projectRoot);

  const baseBranch = baseBranchOverride ?? state.defaultBaseBranch;

  const gitDir = path.join(projectRoot, ".gmd", "repo.git");

  await fetchLatest(gitDir);
  await ensureBaseBranchExists(gitDir, baseBranch);
  const usedExistingRemoteBranch = await remoteBranchExists(gitDir, branchName);

  const desiredSlug = branchToFolderSlug(branchName);
  const existingSlugs = new Set(state.workspaces.map((w) => w.folder));
  const folderSlug = resolveSlugCollision(desiredSlug, existingSlugs);

  if (existingSlugs.has(folderSlug)) {
    throw new Error("workspace folder already exists");
  }

  const existingBranch = state.workspaces.find((w) => w.branch === branchName);
  if (existingBranch) {
    throw new Error("branch already exists in a conflicting way");
  }

  const workspaceDir = path.join(projectRoot, folderSlug);
  try {
    await fs.mkdir(workspaceDir, { recursive: false });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("workspace folder already exists");
    }
    throw error;
  }

  await ensureLocalBranch(gitDir, branchName, baseBranch, !usedExistingRemoteBranch);
  await createWorktree(gitDir, workspaceDir, branchName);

  const newEntry = {
    branch: branchName,
    folder: folderSlug,
    path: folderSlug,
    baseBranch,
    createdAt: new Date().toISOString(),
  };

  const newState: ProjectState = {
    defaultBaseBranch: state.defaultBaseBranch,
    workspaces: [...state.workspaces, newEntry],
  };

  await saveState(projectRoot, newState);

  return {
    projectRoot,
    workspacePath: workspaceDir,
    branch: branchName,
    baseBranch,
    usedExistingRemoteBranch,
  };
}
