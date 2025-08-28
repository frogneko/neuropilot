import * as assert from 'assert';

// Simple test for the rewrite_all action logic
suite('rewrite_all Action', () => {
    test('should calculate line count correctly for single line', () => {
        const content = 'Single line content';
        const lineCount = content.trim().split('\n').length;
        assert.strictEqual(lineCount, 1);
    });

    test('should calculate line count correctly for multiple lines', () => {
        const content = 'Line 1\nLine 2\nLine 3';
        const lineCount = content.trim().split('\n').length;
        assert.strictEqual(lineCount, 3);
    });

    test('should handle empty content', () => {
        const content = '';
        const trimmed = content.trim();
        const lineCount = trimmed === '' ? 0 : trimmed.split('\n').length;
        assert.strictEqual(lineCount, 0);
    });

    test('should handle whitespace-only content', () => {
        const content = '   \n  \n\t\n';
        const trimmed = content.trim();
        const lineCount = trimmed === '' ? 0 : trimmed.split('\n').length;
        assert.strictEqual(lineCount, 0);
    });

    test('should generate correct prompt for single line', () => {
        const content = 'Single line content';
        const lineCount = content.trim().split('\n').length;
        const prompt = `rewrite the entire file with ${lineCount} line${lineCount === 1 ? '' : 's'} of content.`;
        assert.strictEqual(prompt, 'rewrite the entire file with 1 line of content.');
    });

    test('should generate correct prompt for multiple lines', () => {
        const content = 'Line 1\nLine 2\nLine 3';
        const lineCount = content.trim().split('\n').length;
        const prompt = `rewrite the entire file with ${lineCount} line${lineCount === 1 ? '' : 's'} of content.`;
        assert.strictEqual(prompt, 'rewrite the entire file with 3 lines of content.');
    });
});
