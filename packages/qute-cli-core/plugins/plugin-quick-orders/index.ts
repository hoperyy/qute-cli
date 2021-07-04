import * as childProcess from 'child_process';

export default class Registry {
    constructor() { };

    apply({ hooks, createHook, registerCommander, existedCommanders }): void {
        const { run } = existedCommanders;

        registerCommander('dev [env]', {
            description: '本地 dev',
            async callback(env) {
                run(`dev-${env}`, { watch: true, });
            }
        });

        registerCommander('build [env]', {
            description: '本地 build',
            async callback(env) {
                run(`build-${env}`);
            }
        });

        registerCommander('dev-daily', {
            description: '本地 daily',
            async callback() {
                run(`dev-daily`, { watch: true, });
            }
        });

        registerCommander('dev-pre', {
            description: '本地 daily',
            async callback() {
                run(`dev-pre`, { watch: true, });
            }
        });

        registerCommander('dev-prod', {
            description: '本地 daily',
            async callback() {
                run(`dev-prod`, { watch: true, });
            }
        });

        registerCommander('build-daily', {
            description: '本地 daily',
            async callback() {
                run(`build-daily`);
            }
        });

        registerCommander('build-pre', {
            description: '本地 pre',
            async callback() {
                run(`build-pre`);
            }
        });

        registerCommander('build-prod', {
            description: '本地 prod',
            async callback() {
                run(`build-prod`);
            }
        });
    };
}
