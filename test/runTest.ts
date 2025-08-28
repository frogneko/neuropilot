import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import * as fs from 'fs';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        const extensionDevelopmentPath = path.resolve(__dirname, '../');

        // The path to test runner
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // Try to find existing VS Code installation
        let vscodeExecutablePath: string | undefined;
        
        // Common VS Code installation paths
        const possiblePaths = [
            // Windows
            'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
            'C:\\Program Files\\Microsoft VS Code\\Code.exe',
            'C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe',
            // macOS
            '/Applications/Visual Studio Code.app/Contents/MacOS/Electron',
            // Linux
            '/usr/bin/code',
            '/usr/local/bin/code',
            '/snap/bin/code'
        ];

        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                vscodeExecutablePath = possiblePath;
                console.log(`Using existing VS Code installation: ${vscodeExecutablePath}`);
                break;
            }
        }

        // Download VS Code, unzip it and run the integration test
        await runTests({ 
            extensionDevelopmentPath, 
            extensionTestsPath,
            vscodeExecutablePath, // Use existing installation if found
            launchArgs: [
                '--disable-workspace-trust',
                '--disable-gpu',
                '--disable-software-rasterizer'
            ]
        });
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();
