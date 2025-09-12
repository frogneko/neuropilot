/* eslint-disable @stylistic/indent */
import * as vscode from 'vscode';

import { NEURO } from '@/constants';
import { combineGlobLines, filterFileContents, getFence, getVirtualCursor, getWorkspacePath, isBinary, isPathNeuroSafe, logOutput, normalizePath } from '@/utils';
import { ActionData, contextNoAccess, RCEAction, actionValidationFailure, actionValidationAccept, ActionValidationResult, stripToActions } from '@/neuro_client_helper';
import { CONFIG, PERMISSIONS, getPermissionLevel, isActionEnabled } from '@/config';

/**
 * The path validator.
 * @param path The relative path to the file/folder.
 * @param shouldExist Whether the file/folder should exist for validation to succeed. `true` returns a failure if it doesn't exist, `false` returns a failure if it does.
 * @param pathType What type of path it is.
 * @returns A validation message. {@link actionValidationFailure} if any validation steps fail, {@link actionValidationAccept} otherwise.
 */
async function validatePath(path: string, shouldExist: boolean, pathType: string): Promise<ActionValidationResult> {
	if (path === '') {
		return actionValidationFailure('No file path specified.', true);
	};
	const relativePath = normalizePath(path).replace(/^\/|\/$/g, '');
	const absolutePath = getWorkspacePath() + '/' + relativePath;
	if (!isPathNeuroSafe(absolutePath)) {
		return actionValidationFailure(`You are not allowed to access this ${pathType}.`);
	}

	const doesExist = await getPathExistence(relativePath);
	if (!shouldExist && doesExist) {
		return actionValidationFailure(`${pathType} "${path}" already exists.`);
	} else if (shouldExist && !doesExist) {
		return actionValidationFailure(`${pathType} "${path}" doesn't exist.`);
	}

	return actionValidationAccept();
};

async function getPathExistence(relativePath: string): Promise<boolean> {
	const base = vscode.workspace.workspaceFolders?.[0]?.uri;
	if (!base) return false;
	const pathAsUri = vscode.Uri.joinPath(base, relativePath);
	try {
		await vscode.workspace.fs.stat(pathAsUri);
		return true;
	} catch {
		return false;
	}
}

async function neuroSafeValidation(actionData: ActionData): Promise<ActionValidationResult> {
	let result: ActionValidationResult = actionValidationAccept();
	const falseList = [
		'open_file',
		'read_file',
	];
	const shouldExist = falseList.includes(actionData.name);
	if (actionData.params?.filePath) {
		result = await validatePath(actionData.params.filePath, shouldExist, 'file');
	}
	if (!result.success) return result;
	if (actionData.params?.folderPath) {
		result = await validatePath(actionData.params.folderPath, shouldExist, 'folder');
	}
	return result;
}

async function neuroSafeDeleteValidation(actionData: ActionData): Promise<ActionValidationResult> {
	const check = await validatePath(actionData.params.path, true, actionData.params.recursive ? 'folder' : 'file');
	if (!check.success) return check;

	const base = vscode.workspace.workspaceFolders![0].uri;
	const relative = normalizePath(actionData.params.path).replace(/^\/|\/$/g, '');
	const stat = await vscode.workspace.fs.stat(vscode.Uri.joinPath(base, relative));
	if (stat.type === vscode.FileType.File && actionData.params.recursive)
		return actionValidationFailure(`Cannot delete file ${actionData.params.path} with recursive.`);
	else if (stat.type === vscode.FileType.Directory && !actionData.params.recursive)
		return actionValidationFailure(`Cannot delete directory ${actionData.params.path} without recursive.`);

	return actionValidationAccept();
}

async function neuroSafeRenameValidation(actionData: ActionData): Promise<ActionValidationResult> {
	let check = await validatePath(actionData.params.oldPath, true, 'directory');
	if (!check.success) return check;
	check = await validatePath(actionData.params.newPath, false, 'directory');
	if (!check.success) return check;

	return actionValidationAccept();
}

async function binaryFileValidation(actionData: ActionData): Promise<ActionValidationResult> {
	const relativePath = actionData.params.filePath;
	const base = vscode.workspace.workspaceFolders![0].uri;
	const file = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(base, normalizePath(relativePath).replace(/^\/|\/$/g, '')));
	if (await isBinary(file)) {
		return actionValidationFailure('You cannot open a binary file.');
	}
	return actionValidationAccept();
}

export const fileActions = {
	get_files: {
		name: 'get_files',
		description: 'Get a list of files in the workspace',
		permissions: [PERMISSIONS.openFiles],
		handler: handleGetFiles,
		validator: [() => {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (workspaceFolder === undefined)
				return actionValidationFailure('No open workspace to get files from.');
			return actionValidationAccept();
		},
		],
		promptGenerator: 'get a list of files in the workspace.',
	},
	open_file: {
		name: 'open_file',
		description: 'Open a file in the workspace. You cannot open a binary file directly.',
		schema: {
			type: 'object',
			properties: {
				filePath: { type: 'string' },
			},
			required: ['filePath'],
			additionalProperties: false,
		},
		permissions: [PERMISSIONS.openFiles],
		handler: handleOpenFile,
		validator: [neuroSafeValidation, binaryFileValidation],
		promptGenerator: (actionData: ActionData) => `open the file "${actionData.params?.filePath}".`,
	},
	read_file: {
		name: 'read_file',
		description: 'Read a file\'s contents without opening it.',
		schema: {
			type: 'object',
			properties: {
				filePath: { type: 'string' },
			},
			required: ['filePath'],
			additionalProperties: false,
		},
		permissions: [PERMISSIONS.openFiles],
		handler: handleReadFile,
		validator: [neuroSafeValidation, binaryFileValidation],
		promptGenerator: (actionData: ActionData) => `read the file "${actionData.params?.filePath}" (without opening it).`,
	},
	create_file: {
		name: 'create_file',
		description: 'Create a new file at the specified path. The path should include the name of the new file.',
		schema: {
			type: 'object',
			properties: {
				filePath: { type: 'string' },
			},
			required: ['filePath'],
			additionalProperties: false,
		},
		permissions: [PERMISSIONS.create],
		handler: handleCreateFile,
		validator: [neuroSafeValidation],
		promptGenerator: (actionData: ActionData) => `create the file "${actionData.params?.filePath}".`,
	},
	create_folder: {
		name: 'create_folder',
		description: 'Create a new folder at the specified path. The path should include the name of the new folder.',
		schema: {
			type: 'object',
			properties: {
				folderPath: { type: 'string' },
			},
			required: ['folderPath'],
			additionalProperties: false,
		},
		permissions: [PERMISSIONS.create],
		handler: handleCreateFolder,
		validator: [neuroSafeValidation],
		promptGenerator: (actionData: ActionData) => `create the folder "${actionData.params?.folderPath}".`,
	},
	rename_file_or_folder: {
		name: 'rename_file_or_folder',
		description: 'Rename a file or folder. Specify the full relative path for both the old and new names.',
		schema: {
			type: 'object',
			properties: {
				oldPath: { type: 'string' },
				newPath: { type: 'string' },
			},
			required: ['oldPath', 'newPath'],
			additionalProperties: false,
		},
		permissions: [PERMISSIONS.rename],
		handler: handleRenameFileOrFolder,
		validator: [neuroSafeRenameValidation],
		promptGenerator: (actionData: ActionData) => `rename "${actionData.params?.oldPath}" to "${actionData.params?.newPath}".`,
	},
	delete_file_or_folder: {
		name: 'delete_file_or_folder',
		description: 'Delete a file or folder. If you want to delete a folder, set the "recursive" parameter to true.',
		schema: {
			type: 'object',
			properties: {
				path: { type: 'string' },
				recursive: { type: 'boolean' },
			},
			required: ['path'],
			additionalProperties: false,
		},
		permissions: [PERMISSIONS.delete],
		handler: handleDeleteFileOrFolder,
		validator: [neuroSafeDeleteValidation],
		promptGenerator: (actionData: ActionData) => `delete "${actionData.params?.pathToDelete}".`,
	},
} satisfies Record<string, RCEAction>;

export function registerFileActions() {
	if (getPermissionLevel(PERMISSIONS.openFiles)) {
		NEURO.client?.registerActions(stripToActions([
			fileActions.get_files,
			fileActions.open_file,
			fileActions.read_file,
		]).filter(isActionEnabled));
	}

	if (getPermissionLevel(PERMISSIONS.create)) {
		NEURO.client?.registerActions(stripToActions([
			fileActions.create_file,
			fileActions.create_folder,
		]).filter(isActionEnabled));
	}

	if (getPermissionLevel(PERMISSIONS.rename)) {
		NEURO.client?.registerActions(stripToActions([
			fileActions.rename_file_or_folder,
		]).filter(isActionEnabled));
	}

	if (getPermissionLevel(PERMISSIONS.delete)) {
		NEURO.client?.registerActions(stripToActions([
			fileActions.delete_file_or_folder,
		]).filter(isActionEnabled));
	}
}

export function handleCreateFile(actionData: ActionData): string | undefined {
	const relativePathParam = actionData.params.filePath;
	const relativePath = normalizePath(relativePathParam).replace(/^\//, '');
	const absolutePath = getWorkspacePath() + '/' + relativePath;
	if (!isPathNeuroSafe(absolutePath))
		return contextNoAccess(absolutePath);

	checkAndOpenFileAsync(absolutePath, relativePath);

	return;

	// Function to avoid pyramid of doom
	async function checkAndOpenFileAsync(absolutePath: string, relativePath: string) {
		const base = vscode.workspace.workspaceFolders![0].uri;
		const fileUri = vscode.Uri.joinPath(base, relativePath);

		// Check if the file already exists
		try {
			await vscode.workspace.fs.stat(fileUri);
			// If no error is thrown, the file already exists
			NEURO.client?.sendContext(`Could not create file: File ${relativePath} already exists`);
			return;
		} catch { /* File does not exist, continue */ }

		// Create the file
		try {
			await vscode.workspace.fs.writeFile(fileUri, new Uint8Array(0));
		} catch (erm: unknown) {
			logOutput('ERROR', `Failed to create file ${relativePath}: ${erm}`);
			NEURO.client?.sendContext(`Failed to create file ${relativePath}`);
			return;
		}

		logOutput('INFO', `Created file ${relativePath}`);
		NEURO.client?.sendContext(`Created file ${relativePath}`);

		// Open the file if Neuro has permission to do so
		if (!getPermissionLevel(PERMISSIONS.openFiles))
			return;

		try {
			const document = await vscode.workspace.openTextDocument(fileUri);
			await vscode.window.showTextDocument(document);
			NEURO.client?.sendContext(`Opened new file ${relativePath}`);
		} catch (erm: unknown) {
			logOutput('ERROR', `Failed to open new file ${relativePath}: ${erm}`);
			NEURO.client?.sendContext(`Failed to open new file ${relativePath}`);
		}
	}
}

export function handleCreateFolder(actionData: ActionData): string | undefined {
	const relativePathParam = actionData.params.folderPath;
	const relativePath = normalizePath(relativePathParam).replace(/^\/|\/$/g, '');
	const absolutePath = getWorkspacePath() + '/' + relativePath;

	checkAndCreateFolderAsync(absolutePath, relativePath);

	return;

	// Function to avoid pyramid of doom
	async function checkAndCreateFolderAsync(absolutePath: string, relativePath: string) {
		const base = vscode.workspace.workspaceFolders![0].uri;
		const folderUri = vscode.Uri.joinPath(base, relativePath);

		// Check if the folder already exists
		try {
			await vscode.workspace.fs.stat(folderUri);
			// If no error is thrown, the folder already exists
			NEURO.client?.sendContext(`Could not create folder: Folder ${relativePath} already exists`);
			return;
		} catch { /* Folder does not exist, continue */ }

		// Create the folder
		try {
			await vscode.workspace.fs.createDirectory(folderUri);
		} catch (erm: unknown) {
			logOutput('ERROR', `Failed to create folder ${relativePath}: ${erm}`);
			NEURO.client?.sendContext(`Failed to create folder ${relativePath}`);
			return;
		}

		logOutput('INFO', `Created folder ${relativePath}`);
		NEURO.client?.sendContext(`Created folder ${relativePath}`);
	}
}

export function handleRenameFileOrFolder(actionData: ActionData): string | undefined {
	const oldRelativePathParam = actionData.params.oldPath;
	const newRelativePathParam = actionData.params.newPath;

	const oldRelativePath = normalizePath(oldRelativePathParam).replace(/^\/|\/$/g, '');
	const newRelativePath = normalizePath(newRelativePathParam).replace(/^\/|\/$/g, '');
	const oldAbsolutePath = getWorkspacePath() + '/' + oldRelativePath;
	const newAbsolutePath = getWorkspacePath() + '/' + newRelativePath;

	checkAndRenameAsync(oldAbsolutePath, oldRelativePath, newAbsolutePath, newRelativePath);

	return;

	// Function to avoid pyramid of doom
	async function checkAndRenameAsync(oldAbsolutePath: string, oldRelativePath: string, newAbsolutePath: string, newRelativePath: string) {
		const base = vscode.workspace.workspaceFolders![0].uri;
		const oldUri = vscode.Uri.joinPath(base, oldRelativePath);
		const newUri = vscode.Uri.joinPath(base, newRelativePath);


		// Capture which editors reference the old path (file or within folder) before the rename
		const activeBeforeUri = vscode.window.activeTextEditor?.document.uri ?? null;
		const activeUriStr = activeBeforeUri?.toString().toLowerCase() ?? null;
		const oldPathLower = oldUri.path.toLowerCase();
		const visibleEditorsPointingToOld = vscode.window.visibleTextEditors
			.filter(ed => {
				const p = ed.document.uri.path.toLowerCase();
				return p === oldPathLower || p.startsWith(oldPathLower + '/');
			})
			.map(ed => ({ uri: ed.document.uri, viewColumn: ed.viewColumn, wasActive: ed.document.uri.toString().toLowerCase() === activeUriStr }));



		// Check if the new path already exists
		try {
			await vscode.workspace.fs.stat(newUri);
			// If no error is thrown, the new path already exists
			NEURO.client?.sendContext(`Could not rename: ${newRelativePath} already exists`);
			return;
		} catch { /* New path does not exist, continue */ }

		// Rename the file/folder
		try {
			await vscode.workspace.fs.rename(oldUri, newUri);
		} catch (erm: unknown) {
			logOutput('ERROR', `Failed to rename ${oldRelativePath} to ${newRelativePath}: ${erm}`);
			NEURO.client?.sendContext(`Failed to rename ${oldRelativePath} to ${newRelativePath}`);
			return;
		}

		logOutput('INFO', `Renamed ${oldRelativePath} to ${newRelativePath}`);

		// Re-target any open editors that pointed to the old location
		try {
			for (const { uri, viewColumn, wasActive } of visibleEditorsPointingToOld) {
				const suffix = uri.path.substring(oldUri.path.length);
				const segments = suffix.replace(/^\//, '').split('/').filter(Boolean);
				const targetUri = segments.length ? vscode.Uri.joinPath(newUri, ...segments) : newUri;
				const doc = await vscode.workspace.openTextDocument(targetUri);
				await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: !wasActive, viewColumn: viewColumn });
			}



			// Close any tabs that still reference the old paths after rename (do not close retargeted ones)
			const oldPathLowerAfter = oldUri.path.toLowerCase();
			for (const group of vscode.window.tabGroups.all) {
				for (const tab of group.tabs) {
					if (tab.input instanceof vscode.TabInputText) {
						const p = tab.input.uri.path.toLowerCase();
						if (p === oldPathLowerAfter || p.startsWith(oldPathLowerAfter + '/')) {
							try { await vscode.window.tabGroups.close(tab, true); } catch { /* best-effort */ }
						}
					}
				}
			}

			// Restore focus to the previously active editor:
			// - If it belonged to the renamed path, activate its new mapped URI
			// - Otherwise, ensure it remains the active editor
			if (activeBeforeUri) {
				const activePathLower = activeBeforeUri.path.toLowerCase();
				let targetForActive = activeBeforeUri;
				if (activePathLower === oldPathLower || activePathLower.startsWith(oldPathLower + '/')) {
					const suffix = activeBeforeUri.path.substring(oldUri.path.length);
					const segments = suffix.replace(/^\//, '').split('/').filter(Boolean);
					targetForActive = segments.length ? vscode.Uri.joinPath(newUri, ...segments) : newUri;
				}
				try {
					const doc = await vscode.workspace.openTextDocument(targetForActive);
					await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: false });
				} catch { /* best-effort */ }
			}
		} catch { /* best-effort remediation */ }

		// Notify after all UI retargeting is complete so tests can await this point
		NEURO.client?.sendContext(`Renamed ${oldRelativePath} to ${newRelativePath}`);
	}
}

export function handleDeleteFileOrFolder(actionData: ActionData): string | undefined {
	const relativePathParam = actionData.params.path;
	const recursive = actionData.params.recursive ?? false;

	const relativePath = normalizePath(relativePathParam).replace(/^\/|\/$/g, '');
	const absolutePath = getWorkspacePath() + '/' + relativePath;

	checkAndDeleteAsync(absolutePath, relativePath, recursive);

	return;

	// Function to avoid pyramid of doom
	async function checkAndDeleteAsync(absolutePath: string, relativePath: string, recursive: boolean) {
		const base = vscode.workspace.workspaceFolders![0].uri;
		const uri = vscode.Uri.joinPath(base, relativePath);
		let stat: vscode.FileStat;

		// Check if the path exists
		try {
			stat = await vscode.workspace.fs.stat(uri);
		} catch {
			NEURO.client?.sendContext(`Could not delete: ${relativePath} does not exist`);
			return;
		}

		// Check for correct recursive parameter
		if (stat.type === vscode.FileType.Directory && !recursive) {
			NEURO.client?.sendContext(`Could not delete: ${relativePath} is a directory cannot be deleted without the "recursive" parameter`);
			return;
		}

		// Delete the file/folder
		try {
			const useTrash = base.scheme === 'file';
			await vscode.workspace.fs.delete(uri, { recursive, useTrash });
		} catch (erm: unknown) {
			logOutput('ERROR', `Failed to delete ${relativePath}: ${erm}`);
			NEURO.client?.sendContext(`Failed to delete ${relativePath}`);
			return;
		}

		// If a file was deleted and it was open, close its editor tabs
		try {
			if (stat.type === vscode.FileType.File) {
				for (const group of vscode.window.tabGroups.all) {
					for (const tab of group.tabs) {
						if (tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === uri.toString()) {
							await vscode.window.tabGroups.close(tab, true);
						}
					}
				}
				// Also ensure it's not in visibleTextEditors
				for (const editor of vscode.window.visibleTextEditors) {
					if (editor.document.uri.toString() === uri.toString()) {
						await vscode.window.showTextDocument(editor.document);
						await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
					}
				}
				// Fallback: if still visible somewhere, close editors in all groups
				if (vscode.window.visibleTextEditors.some(e => e.document.uri.toString() === uri.toString())) {
					await vscode.commands.executeCommand('workbench.action.closeEditorsInAllGroups');
				}
			}
		} catch {
			// best-effort; ignore if closing fails
		}

		logOutput('INFO', `Deleted ${relativePath}`);
		NEURO.client?.sendContext(`Deleted ${relativePath}`);
	}
}

export function handleGetFiles(_actionData: ActionData): string | undefined {
	const includePattern = combineGlobLines(CONFIG.includePattern || '**'); // '**' works for vscode but not for glob-to-regexp
	const excludePattern = combineGlobLines(CONFIG.excludePattern || '');
	vscode.workspace.findFiles(includePattern, excludePattern).then(
		(uris) => {
			const paths = uris
				.filter(uri => isPathNeuroSafe(uri.fsPath, false))
				.map(uri => vscode.workspace.asRelativePath(uri))
				.sort((a, b) => {
					const aParts = a.split('/');
					const bParts = b.split('/');

					for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
						if (aParts[i] !== bParts[i]) {
							if (aParts.length === i + 1) return -1;
							if (bParts.length === i + 1) return 1;
							return aParts[i].localeCompare(bParts[i]);
						}
					}
					return aParts.length - bParts.length;
				});
			logOutput('INFO', 'Sending list of files in workspace to Neuro');
			NEURO.client?.sendContext(`Files in workspace:\n\n${paths.join('\n')}`);
		},
	);

	return undefined;
}

export function handleOpenFile(actionData: ActionData): string | undefined {
	const relativePath = actionData.params.filePath;

	const base = vscode.workspace.workspaceFolders![0].uri;
	const uri = vscode.Uri.joinPath(base, normalizePath(relativePath));
	if (!isPathNeuroSafe(getWorkspacePath() + '/' + normalizePath(relativePath)))
		return contextNoAccess(uri.fsPath);

	openFileAsync();
	return;

	async function openFileAsync() {
		try {
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document);

			logOutput('INFO', `Opened file ${relativePath}`);

			// Usually handled by editorChangedHandler in editing.ts, except if this setting is off
			if (!CONFIG.sendContentsOnFileChange) {
				const cursorOffset = document.offsetAt(getVirtualCursor() ?? new vscode.Position(0, 0));
				let text = document.getText();
				text = text.slice(0, cursorOffset) + '<<<|>>>' + text.slice(cursorOffset);
				const fence = getFence(text);
				NEURO.client?.sendContext(`Opened file ${relativePath}\n\nContent (cursor position denoted by \`<<<|>>>\`):\n\n${fence}${document.languageId}\n${filterFileContents(text)}\n${fence}`);
			}
		}
		catch (erm: unknown) {
			logOutput('ERROR', `Failed to open file ${relativePath}: ${erm}`);
			NEURO.client?.sendContext(`Failed to open file ${relativePath}`);
		}
	}
}

export function handleReadFile(actionData: ActionData): string | undefined {
	const file = actionData.params.filePath;
	const relative = normalizePath(file).replace(/^\/|\/$/g, '');
	const absolute = getWorkspacePath() + '/' + relative;
	if (!isPathNeuroSafe(absolute)) {
		return contextNoAccess(file);
	}
	const base = vscode.workspace.workspaceFolders![0].uri;
	const fileAsUri = vscode.Uri.joinPath(base, relative);
	try {
		vscode.workspace.fs.readFile(fileAsUri).then(
			(data: Uint8Array) => {
				const decodedContent = Buffer.from(data).toString('utf8');
				const fence = getFence(decodedContent);
				NEURO.client?.sendContext(`Contents of the file ${file}:\n\n${fence}\n${decodedContent}\n${fence}`);
			},
			(erm) => {
				logOutput('ERROR', `Couldn't read file ${absolute}: ${erm}`);
				NEURO.client?.sendContext(`Couldn't read file ${file}.`);
			},
		);
	} catch (erm) {
		logOutput('ERROR', `Error occured while trying to access file ${file}: ${erm}`);
	}
}

/**
 * Only for unit tests, DO NOT USE THESE EXPORTS IN PRODUCTION CODE.
 * @private
 */
export const _internals = {
	validatePath,
	getPathExistence,
	neuroSafeValidation: neuroSafeValidation,
	neuroSafeDeleteValidation: neuroSafeDeleteValidation,
	neuroSafeRenameValidation: neuroSafeRenameValidation,
};

