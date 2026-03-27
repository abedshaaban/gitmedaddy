export interface ProjectStateIssue {
  path: string
  message: string
  repairable: boolean
}

export class InvalidProjectStateError extends Error {
  constructor(
    public readonly projectRoot: string,
    public readonly issues: Array<ProjectStateIssue>
  ) {
    const summary = issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')
    super(`Invalid project state: ${summary}`)
    this.name = 'InvalidProjectStateError'
  }
}
