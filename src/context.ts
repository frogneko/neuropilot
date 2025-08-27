import * as vscode from 'vscode';

import { getFence, logOutput, simpleFileName } from '@/utils';
import { NEURO } from '@/constants';
import { PERMISSIONS, getPermissionLevel } from '@/config';

export function sendCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        logOutput('ERROR', 'No active text editor');
        vscode.window.showErrorMessage('No active text editor.');
        return;
    }
    const document = editor.document;
    const fileName = simpleFileName(document.fileName);
    const language = document.languageId;
    const text = document.getText();

    if (!NEURO.connected) {
        logOutput('ERROR', 'Attempted to send current file while disconnected');
        vscode.window.showErrorMessage('Not connected to Neuro API.');
        return;
    }

    logOutput('INFO', 'Sending current file to Neuro API');
    const fence = getFence(text);
    NEURO.client?.sendContext(`Current file: ${fileName}\n\nContent:\n\n${fence}${language}\n${text}\n${fence}`);
}

export function registerRequestCookieAction() {
    NEURO.client?.unregisterActions(['request_cookie']);

    if (!getPermissionLevel(PERMISSIONS.requestCookies))
        return;

    NEURO.client?.registerActions([
        {
            name: 'request_cookie',
            description: "Ask Vedal for a cookie. You can request a specific flavor, but it's up to Vedal to decide.",
            schema: {
                type: 'object',
                properties: {
                    flavor: { type: 'string' },
                },
            },
        },
    ]);
}

export function registerRequestCookieHandler() {
    NEURO.client?.onAction((actionData) => {
        if (actionData.name === 'request_cookie') {
            NEURO.actionHandled = true;

            if (!getPermissionLevel(PERMISSIONS.requestCookies)) {
                logOutput('WARNING', 'Neuro attempted to request a cookie, but permission is disabled');
                NEURO.client?.sendActionResult(actionData.id, true, 'Permission to request cookies is disabled.');
            }
            if (NEURO.waitingForCookie) {
                logOutput('INFO', 'Already waiting for a cookie');
                NEURO.client?.sendActionResult(actionData.id, true, 'You already asked for a cookie.');
                return;
            }
            NEURO.waitingForCookie = true;
            NEURO.client?.sendActionResult(actionData.id, true, 'Vedal has been asked for a cookie.');

            vscode.window.showInformationMessage(
                `${NEURO.currentController} is asking for a${actionData.params?.flavor ? ' ' + actionData.params.flavor : ''} cookie.`,
                'Give',
                'Deny',
            ).then((value) => {
                if (value === 'Give') {
                    giveCookie(true, actionData.params?.flavor);
                } else if (value === 'Deny' || value === undefined) {
                    denyCookie();
                }
                NEURO.waitingForCookie = false;
            });
        }
    });
}

export function giveCookie(isRequested = false, defaultFlavor = 'Chocolate Chip') {
    NEURO.waitingForCookie = false;
    if (!NEURO.connected) {
        logOutput('ERROR', 'Attempted to give cookie while disconnected');
        vscode.window.showErrorMessage('Not connected to Neuro API.');
        return;
    }

    vscode.window.showInputBox({
        prompt: 'What flavor?',
        placeHolder: 'Chocolate Chip',
        value: defaultFlavor,
        title: `Give ${NEURO.currentController} a cookie`,
    }).then((flavor) => {
        if (!flavor) {
            logOutput('INFO', 'No flavor given, canceling cookie');
            if (isRequested)
                NEURO.client?.sendContext("Vedal couldn't decide on a flavor for your cookie.");
            return;
        }
        logOutput('INFO', 'Giving cookie to Neuro');
        NEURO.client?.sendContext(`Vedal gave you a ${flavor} cookie!`);
    });
}

export function denyCookie() {
    NEURO.waitingForCookie = false;
    if (!NEURO.connected) {
        logOutput('ERROR', 'Attempted to deny cookie while disconnected');
        vscode.window.showErrorMessage('Not connected to Neuro API.');
        return;
    }

    logOutput('INFO', 'Denying cookie to Neuro');
    NEURO.client?.sendContext('Vedal denied you the cookie.');
}
