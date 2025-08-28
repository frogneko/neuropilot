---
"neuropilot": minor
---

Added new `rewrite_all` action to allow Neuro to completely rewrite file contents.

- New `rewrite_all` action allows Neuro to replace the entire content of a file
- Action requires `editActiveDocument` permission
- Cursor is automatically positioned at the beginning of the file after rewrite
- Returns success message with file path and line count of new content
- Follows same validation and permission patterns as other editing actions
- Action is disabled by default and can be enabled through VS Code settings
