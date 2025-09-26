# JunctionHackathon_Team-GitHappens

## Git Techniques
#### Git Branches
Each team member has their own branches, push your code there

When your new functionality is ready, merge with dev

At some point we will agree to merge with main

#### Updating your branches (Important before merging)

The following should be done to update your personal branch with dev

Do this before **merging with dev** or to **pull changes from dev**
```
git checkout <Personal Branch>   // Make sure you are on personal branch
git fetch origin dev:dev         // Updates dev to match GitHub repo
git rebase origin/dev            // This will update your branch with dev
```
At this point your branch is now up to date with dev or you have merge conflicts to solve

If you have any merge conflicts, the files will be marked, go through the files are solve any conflicts, then do the following
```
git add .                         // Add all changed files
git rebase --continue             // Continue to next commit
```
You may get a new set of conflicted files, repeat as you did above until you get a successful rebase message
