import * as assert from 'assert';
import { editingActions } from '@/editing';
import { ActionData } from '@/neuro_client_helper';

// Tests for the delete_text action prompt generator using real logic
suite('delete_text Action', () => {
    test('generates a prompt and includes escaped find when useRegex is true', () => {
        const prompt = editingActions.delete_text.promptGenerator({
            params: { find: 'a+b', useRegex: true },
        } as ActionData);
        assert.ok(typeof prompt === 'string' && prompt.length > 0);
        assert.ok(prompt.includes('a\\+b'));
    });

    test('generates a prompt and includes raw find when useRegex is false', () => {
        const prompt = editingActions.delete_text.promptGenerator({
            params: { find: 'hello', useRegex: false },
        } as ActionData);
        assert.ok(typeof prompt === 'string' && prompt.length > 0);
        assert.ok(prompt.includes('hello'));
    });
});


