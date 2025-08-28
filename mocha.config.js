module.exports = {
    require: ['ts-node/register/transpile-only'],
    extension: ['ts'],
    spec: ['test/rewrite_all.simple.test.ts'],
    timeout: 5000,
    reporter: 'spec',
    ui: 'tdd',
    colors: true,
    bail: false,
    recursive: true,
    ignore: ['node_modules/**/*'],
    'ts-node': {
        project: './tsconfig.test.json'
    }
};
