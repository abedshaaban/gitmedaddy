import { printInfo } from '../cli/output'
import { showWorkspace } from '../core/workspace'
import { branchToFolderSlug } from '../utils/slug'
import { promptInput, promptSelect } from '../utils/prompt'
import { loadState } from '../config/load'
import { fetchLatest, listLocalBranches, listRemoteBranches, resolveGitCommonDirFromState } from '../git/repo'
import { findProjectRoot } from '../utils/findProjectRoot'
import { executeCommand } from './_shared'
import type { Command } from 'commander'

export function registerShowCommand(program: Command) {
  program
    .command('show')
    .alias('s')
    .argument('[branch-name]', 'Name of the existing branch to display (or select one)')
    .description('Display an existing branch as a workspace folder')
    .action(async (branchNameArg: string | undefined, _options: object, command: Command) => {
      await executeCommand(command, async (behavior) => {
        let branchNameToShow: string | undefined = branchNameArg
        if (!branchNameToShow) {
          if (!behavior.interactive) {
            throw new Error('branch name is required when interactive mode is disabled')
          }

          const projectRoot = findProjectRoot(process.cwd())
          if (!projectRoot) {
            throw new Error('not inside a gitmedaddy project')
          }

          const state = await loadState(projectRoot)
          const gitDir = await resolveGitCommonDirFromState(projectRoot, state)

          // Ensure remote-tracking refs are up to date before listing them.
          await fetchLatest(gitDir)

          const visibleBranches = new Set(state.workspaces.map((w) => w.branch))
          const [remoteBranches, localBranches] = await Promise.all([
            listRemoteBranches(gitDir),
            listLocalBranches(gitDir)
          ])

          const options = Array.from(new Set([...localBranches, ...remoteBranches]))
            .filter((b) => b.trim() !== '')
            .filter((b) => b !== 'origin' && !b.startsWith('origin/'))
            .filter((b) => !visibleBranches.has(b))
            .sort((a, b) => a.localeCompare(b))

          if (options.length === 0) {
            throw new Error('no hidden branches available to show')
          }

          branchNameToShow = await promptSelect(
            'Select the branch to display',
            options,
            // If the default is currently visible, promptSelect will fall back to the first option.
            state.defaultBaseBranch
          )
        }

        if (!branchNameToShow) {
          throw new Error('no branch selected')
        }

        const defaultFolderName = branchToFolderSlug(branchNameToShow)
        const folderName = behavior.interactive
          ? await promptInput('Workspace folder name', defaultFolderName)
          : defaultFolderName

        const result = await showWorkspace({
          branchName: branchNameToShow,
          folderName,
          cwd: process.cwd()
        })

        if (result.usedRemoteBranch) {
          printInfo(`Using remote branch "${branchNameToShow}" and displaying it locally.`, behavior)
        } else {
          printInfo(`Using local branch "${branchNameToShow}" and displaying it locally.`, behavior)
        }

        return result
      })
    })
}
