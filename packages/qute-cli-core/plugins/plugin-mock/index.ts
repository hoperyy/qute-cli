import Action from './action';

export default class Mock {
    constructor() {};

    apply({ hooks, createHook, registerCommander }): void {
        registerCommander('mock [port]', {
            description: 'mock',
            options: [
                ['-s, --https', 'watch file changes'],
            ],
            async callback(port, options) {
                const action = new Action();
                await action.run(port, { force: true, ...options });
            }
        });
    };
}
