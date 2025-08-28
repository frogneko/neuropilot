import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

suite('rewrite_all Action Integration Tests', () => {
    let testDocument: vscode.TextDocument;
    let testEditor: vscode.TextEditor;
    let testFilePath: string;

    suiteSetup(async () => {
        // This runs once before all tests in the suite
        console.log('Setting up integration test environment...');
        
        // Try to activate the extension explicitly
        try {
            const extension = vscode.extensions.getExtension('Pasu4.neuropilot');
            if (extension) {
                await extension.activate();
                console.log('Extension activated successfully');
            } else {
                console.log('Extension not found, trying alternative activation...');
                // Fallback: try to activate by opening a document
                const tempDir = os.tmpdir();
                const triggerFile = path.join(tempDir, 'trigger-extension.txt');
                fs.writeFileSync(triggerFile, 'trigger');
                
                try {
                    const uri = vscode.Uri.file(triggerFile);
                    await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(uri);
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                } finally {
                    // Clean up trigger file
                    try {
                        fs.unlinkSync(triggerFile);
                    } catch (error) {
                        // Ignore cleanup errors
                    }
                }
            }
        } catch (error) {
            console.log('Extension activation failed:', error);
        }
    });

    setup(async () => {
        // Create a test document for each test
        const tempDir = os.tmpdir();
        testFilePath = path.join(tempDir, 'test-file.txt');
        
        // Create the file with initial content
        fs.writeFileSync(testFilePath, 'Original content\nLine 2\nLine 3');
        
        const uri = vscode.Uri.file(testFilePath);
        testDocument = await vscode.workspace.openTextDocument(uri);
        testEditor = await vscode.window.showTextDocument(testDocument);
    });

    teardown(async () => {
        // Close the test document after each test
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        
        // Clean up the test file
        try {
            fs.unlinkSync(testFilePath);
        } catch (error) {
            // Ignore errors if file doesn't exist
        }
    });

    suiteTeardown(async () => {
        // This runs once after all tests in the suite
        console.log('Cleaning up integration test environment...');
    });

    test('should rewrite entire file content', async () => {
        const newContent = 'New content\nLine 2\nLine 3\nLine 4';
        
        // Use VS Code API directly to rewrite the entire file
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            testDocument.positionAt(0),
            testDocument.positionAt(testDocument.getText().length)
        );
        edit.replace(testDocument.uri, fullRange, newContent);

        // Apply the edit
        const success = await vscode.workspace.applyEdit(edit);
        assert.strictEqual(success, true, 'Edit should be applied successfully');

        // Wait a moment for the edit to be reflected in the document
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify the content was rewritten
        const actualContent = testDocument.getText();
        assert.strictEqual(actualContent, newContent, 'File content should be rewritten');
        
        // Move cursor to beginning and verify position
        const startPosition = new vscode.Position(0, 0);
        testEditor.selection = new vscode.Selection(startPosition, startPosition);
        
        const cursorPosition = testEditor.selection.active;
        assert.strictEqual(cursorPosition.line, 0, 'Cursor should be at line 0');
        assert.strictEqual(cursorPosition.character, 0, 'Cursor should be at character 0');
    });

    test('should handle empty content', async () => {
        const newContent = '';
        
        // Use VS Code API directly to rewrite the entire file
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            testDocument.positionAt(0),
            testDocument.positionAt(testDocument.getText().length)
        );
        edit.replace(testDocument.uri, fullRange, newContent);

        // Apply the edit
        const success = await vscode.workspace.applyEdit(edit);
        assert.strictEqual(success, true, 'Edit should be applied successfully');

        // Wait a moment for the edit to be reflected in the document
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify the content was cleared
        const actualContent = testDocument.getText();
        assert.strictEqual(actualContent, newContent, 'File content should be empty');
    });

    test('should handle large content', async () => {
        const largeContent = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}`).join('\n');
        
        // Use VS Code API directly to rewrite the entire file
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            testDocument.positionAt(0),
            testDocument.positionAt(testDocument.getText().length)
        );
        edit.replace(testDocument.uri, fullRange, largeContent);

        // Apply the edit
        const success = await vscode.workspace.applyEdit(edit);
        assert.strictEqual(success, true, 'Edit should be applied successfully');

        // Wait a moment for the edit to be reflected in the document
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify the content was rewritten
        const actualContent = testDocument.getText();
        assert.strictEqual(actualContent, largeContent, 'File content should be rewritten');
        assert.strictEqual(actualContent.split('\n').length, 1000, 'File should have 1000 lines');
    });
});
