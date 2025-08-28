# rewrite_all Action

The `rewrite_all` action allows Neuro to completely replace the entire contents of a file with new content.

## Description

This action provides a way for Neuro to completely rewrite a file's contents, replacing everything in the file with new content. This is useful when you want Neuro to create a completely new version of a file or when you need to replace the entire file structure.

## Permissions

- **Required Permission**: `editActiveDocument`
- **Permission Level**: Copilot or Autopilot mode

## Schema

```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "The new content to replace the entire file with"
    }
  },
  "required": ["content"],
  "additionalProperties": false
}
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | The complete new content for the file |

## Behavior

1. **File Replacement**: The entire file content is replaced with the provided `content`
2. **Cursor Positioning**: After the rewrite, the virtual cursor is automatically positioned at the beginning of the file (line 1, column 1)
3. **Validation**: The action validates that:
   - There is an active document
   - The file path is Neuro-safe (not in excluded patterns)
   - The user has the required permissions

## Response

On success, the action returns a formatted message containing:
- File path (relative to workspace)
- Number of lines in the new content
- The complete new content wrapped in code fences

## Example Usage

### Basic Usage
```json
{
  "name": "rewrite_all",
  "params": {
    "content": "function hello() {\n  console.log('Hello, World!');\n}\n\nmodule.exports = { hello };"
  }
}
```

### Empty File
```json
{
  "name": "rewrite_all",
  "params": {
    "content": ""
  }
}
```

### Multi-line Content
```json
{
  "name": "rewrite_all",
  "params": {
    "content": "# My New File\n\nThis is a completely new file created by Neuro.\n\n## Features\n- Feature 1\n- Feature 2\n\n## Usage\n```javascript\nconsole.log('Hello from the new file!');\n```"
  }
}
```

## Error Handling

The action will return an error message if:
- No active document is open
- The file path is not Neuro-safe (e.g., in `.git` or `.vscode` directories)
- The user doesn't have the required permissions
- The workspace edit fails to apply

## Security Considerations

- The action respects the same file access restrictions as other editing actions
- Files starting with `.` or in excluded patterns cannot be rewritten
- The action requires explicit permission to be enabled in settings

## Related Actions

- `insert_text` - Insert text at a specific position
- `replace_text` - Replace specific text patterns
- `delete_text` - Delete specific text patterns
- `get_content` - Get the current file contents

## Settings

The `rewrite_all` action can be individually disabled using the "Disabled Actions" setting in VS Code preferences. By default, it is disabled and must be explicitly enabled by removing it from the disabled actions list.
