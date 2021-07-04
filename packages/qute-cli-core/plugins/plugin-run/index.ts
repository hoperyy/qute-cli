import Action from './action';

export default class Run {
    constructor() {};

    apply({ hooks, createHook, registerCommander, existedCommanders }): void {
        const callback = async (env, options = { watch: false, diffDeps: false, symlink: false, bigMemory: false }) => {
            await hooks.beforeRun.flush();

            let { watch, diffDeps, symlink, bigMemory } = options;

            const action = new Action();

            await action.run(env, {
                watch,
                showBuild: true,
                supportSymlink: !!symlink,
                bigMemory,
                onFinished: async () => {
                    await hooks.afterRun.flush();
                }
            });
        };

        existedCommanders['run'] = callback;
        registerCommander('run [env]', {
            description: 'run project.',
            options: [
                ['-n, --no-watch', 'watch file changes'],
                ['--symlink', 'support symlink when copying'],
                ['-nodiffdeps, --no-diff-deps', 'skip diff dependencies'],
                ['-B, --show-build', 'show directory "build/"'],
                ['--big-memory', 'set memory limit']
            ],
            callback
        });
    }
}
