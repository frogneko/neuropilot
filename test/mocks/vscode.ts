// Mock VS Code API for testing
export const window = {
    activeTextEditor: {
        document: {
            fileName: 'test/file.txt',
            getText: () => 'Original content',
            positionAt: (offset: number) => ({ line: 0, character: offset }),
            lineCount: 10,
            lineAt: (line: number) => ({ text: 'test line' }),
            uri: { fsPath: 'test/file.txt' }
        },
        selection: {
            active: { line: 0, character: 0 }
        },
        edit: (callback: any) => Promise.resolve(true)
    },
    showTextDocument: (document: any) => Promise.resolve({
        edit: (callback: any) => Promise.resolve(true),
        selection: { active: { line: 0, character: 0 } }
    }),
    showErrorMessage: (message: string) => {},
    showInformationMessage: (message: string) => {}
};

export const workspace = {
    asRelativePath: (uri: any) => 'test/file.txt',
    applyEdit: (edit: any) => Promise.resolve(true),
    openTextDocument: (uri: any) => Promise.resolve({
        fileName: 'test/file.txt',
        getText: () => 'Original content',
        positionAt: (offset: number) => ({ line: 0, character: offset }),
        uri: { fsPath: 'test/file.txt' }
    })
};

export const commands = {
    executeCommand: (command: string) => Promise.resolve()
};

export const Uri = {
    file: (path: string) => ({ fsPath: path })
};

export const Position = (line: number, character: number) => ({ line, character });

export const Range = (start: any, end: any) => ({ start, end });

export const WorkspaceEdit = () => ({
    replace: (uri: any, range: any, text: string) => {}
});
