/**
 * Test file for the rewrite_all action
 * This demonstrates how the rewrite_all action would work
 */

// Example usage of the rewrite_all action
const rewriteAllActionExample = {
    name: 'rewrite_all',
    description: 'Rewrite the entire contents of the file.',
    schema: {
        type: 'object',
        properties: {
            content: { type: 'string' }
        },
        required: ['content'],
        additionalProperties: false,
    },
    permissions: ['editActiveDocument'],
    handler: 'handleRewriteAll',
    validator: ['checkCurrentFile'],
    promptGenerator: (actionData) => {
        const lineCount = actionData.params.content.trim().split('\n').length;
        return `rewrite the entire file with ${lineCount} line${lineCount === 1 ? '' : 's'} of content.`;
    },
};

// Example action data that would be sent to the handler
const exampleActionData = {
    params: {
        content: `// This is a test file
// Created by the rewrite_all action
function testFunction() {
    console.log("Hello from rewrite_all!");
    return true;
}

// The entire file content was replaced
module.exports = { testFunction };`
    }
};

// Expected behavior:
// 1. The entire file content will be replaced with the new content
// 2. The cursor will be positioned at the beginning of the file (line 1, column 1)
// 3. A success message will be returned with file path and line count
// 4. The virtual cursor will be updated to the new position

console.log('rewrite_all action test file created successfully!');
console.log('This action allows Neuro to completely rewrite file contents.');
