# NeuroPilot Actions Documentation

This directory contains documentation for all available actions in NeuroPilot.

## Editing Actions

Actions that allow Neuro to modify the content of files.

### [rewrite_all](./rewrite_all.md)
Completely replace the entire contents of a file with new content.

### Other Editing Actions
- `place_cursor` - Place the cursor at a specific position
- `get_cursor` - Get the current cursor position and surrounding text
- `get_content` - Get the contents of the current file
- `insert_text` - Insert text at a specific position
- `replace_text` - Replace text patterns in the document
- `delete_text` - Delete text patterns from the document
- `find_text` - Find text patterns in the document
- `undo` - Undo the last change
- `save` - Manually save the current document

## File Actions

Actions that allow Neuro to manage files and folders.

- `get_files` - Get a list of files in the workspace
- `open_file` - Open a file in the editor
- `read_file` - Read the contents of a file
- `create_file` - Create a new file
- `create_folder` - Create a new folder
- `rename_file_or_folder` - Rename a file or folder
- `delete_file_or_folder` - Delete a file or folder

## Git Actions

Actions that allow Neuro to interact with Git repositories.

- `init_git_repo` - Initialize a Git repository
- `add_file_to_git` - Add a file to Git staging
- `remove_file_from_git` - Remove a file from Git staging
- `make_git_commit` - Make a Git commit
- `git_status` - Get Git status
- `git_log` - Get Git log
- `git_blame` - Get Git blame information
- `diff_files` - Get differences between files
- `new_git_branch` - Create a new Git branch
- `switch_git_branch` - Switch to a different Git branch
- `delete_git_branch` - Delete a Git branch
- `merge_to_current_branch` - Merge changes to current branch
- `tag_head` - Tag the current HEAD
- `delete_tag` - Delete a Git tag
- `fetch_git_commits` - Fetch commits from remote
- `pull_git_commits` - Pull commits from remote
- `push_git_commits` - Push commits to remote
- `add_git_remote` - Add a Git remote
- `remove_git_remote` - Remove a Git remote
- `rename_git_remote` - Rename a Git remote
- `abort_merge` - Abort a Git merge
- `get_git_config` - Get Git configuration
- `set_git_config` - Set Git configuration

## Terminal Actions

Actions that allow Neuro to interact with the terminal.

- `execute_in_terminal` - Execute a command in the terminal
- `kill_terminal_process` - Kill a terminal process
- `get_currently_running_shells` - Get currently running shells

## Task Actions

Actions that allow Neuro to run VS Code tasks.

- `terminate_task` - Terminate a running task

## Linting Actions

Actions that allow Neuro to access linting information.

- `get_file_lint_problems` - Get lint problems for a file
- `get_folder_lint_problems` - Get lint problems for a folder
- `get_workspace_lint_problems` - Get lint problems for the workspace

## Permission Levels

All actions require specific permission levels to be enabled:

- **Off**: Action is completely disabled
- **Copilot**: Action requires user approval before execution
- **Autopilot**: Action executes automatically without approval

## Security

Actions respect the following security measures:

- File access restrictions (excluded patterns)
- Permission-based access control
- Validation of file paths and parameters
- Safe execution environments

## Configuration

Actions can be individually enabled/disabled through VS Code settings:

1. Open VS Code Settings
2. Search for "NeuroPilot"
3. Configure individual action permissions
4. Use "Disabled Actions" setting to disable specific actions

## Getting Help

For more information about NeuroPilot, visit the [main documentation site](https://vsc-neuropilot.github.io/docs).
