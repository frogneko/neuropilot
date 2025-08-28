// @ts-check
import { context } from 'esbuild';

export async function test(prodFlag, watchFlag) {
    const ctx = await context({
        entryPoints: [
            'test/runTest.ts',
            'test/suite/index.ts',
            'test/integration/rewrite_all.integration.test.ts'
        ],
        bundle: true,
        format: 'cjs',
        minify: false, // Tests should not be minified
        sourcemap: true,
        sourcesContent: false,
        platform: 'node',
        outdir: 'out/test',
        external: ['vscode', 'mocha', 'glob'],
        logLevel: 'warning',
        plugins: [
            /* add to the end of plugins array */
            esbuildProblemMatcherPlugin,
        ],
    });
    if (watchFlag) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',

    setup(build) {
        build.onStart(() => {
            console.log('[watch] test build started');
        });
        build.onEnd(result => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                if (location == null) return;
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] test build finished');
        });
    },
};
