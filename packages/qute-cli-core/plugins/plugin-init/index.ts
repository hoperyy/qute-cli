import Action from './action';

export default class Init {
    constructor() {};

    apply({ hooks, createHook, registerCommander }): void {
        registerCommander('init [scaffoldName]', {
            description: 'init project.',
            async callback(scaffoldName) {
                const beforeInitResult = await hooks.beforeInit.flush();

                if (beforeInitResult && beforeInitResult.disabled) {
                    return;
                }

                const action = new Action({
                    scaffoldName: scaffoldName || 'qute-scaffold-templates',
                });
                await action.run();
                await hooks.afterInit.flush();
            }
        });
    };
}
