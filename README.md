# AI native versioning layer that speaks to Git | Git wrapper for AI

## Thin Git integration layer

gitmedaddy (gmd) is not a replacement of git. It is quite the opposite, it is a wrapper of git that handels things better for us and makes things easier for AI. Under the hood it is all git.

Handles:

- cloning a repo
- branch creation
<!-- -
- worktrees -->
<!-- - commits -->

### Overview

#### Cloning A Repo

gmd supports cloning. It is the same as cloning a repo via git `git clone ...` but with a different structure. You clone the repo branche to your folder.

example:
`gmd clone https://github.com/OWNER/PROJECT_NAME.git`

Then it will ask me couple of questions:

- what is the main branch that you would like to checkout from everytime? (defaults to main)

output:

    PROJECT_NAME
        └── state/
        └── MAIN_BRANCH
            └──src/
            └──package.json

Notice how your folder structure is around your branches and not the current state of a single branch. So your next step to start a repo is going to be `cd MAIN_BRANCH`, `pnpm i`, ....

Why did we go with this structure because I wanted to have multiple agents work on different parts of my projects and sometimes the same page with 2 different features. So it feals hard to distinguise which change is which. Plus each PR should have a single **GOAL** to achieve. And we do so by utilize the git worktree.

Inside the state/ folder we have a meta.json file that contains the state of our workflow and our git purpose. Like the one we just got asked "what is the main branch ... ?" this is since we may need to checkout/ create branches multiple times from the main branch or a staging one but you are not at that curent branch since you are doing changes on a different one. thats where the main checkout branch comes in handy. you checkout from that one always. Don't worry, you can override that and pass the branch you want to checkout from if you want the current one. like so `gmd new ... -h` -h means checkout/ create a new branch from this current branch.

#### Creating Branches

Creating a local branch with gmd will create a new subfolder locally with the branch name being the subfolder name.

example:

    PROJECT_NAME
        └── state/
        └── MAIN_BRANCH
            └──src/
            └──package.json

`gmd new feat/create-footer`

you get prompted a question:

- What is the goal of this branch? // not required and can be left empty.
  the answer is added to the /state folder and contains the new local branch name with its goal to achieve.

      PROJECT_NAME
          └── state/
          └── MAIN_BRANCH
              └──src/
              └──package.json
          └── feat/create-footer
              └──src/
              └──package.json

This enables an agent to work on a local branch that you are able to check in the browser aside from stoping your current work on another branch and relying on a single angent for a single change per PR. And An agent can always check if the PR has achieved its goal by checking teh branch goal. (every pr should have a single goal to work on)
