import Actor from './src/action';

export default class Plugin {
    constructor() { };

    apply({ hooks, createHook, registerCommander }): void {
        registerCommander('plugin [action] [pluginName]', {
            description: 'plugin',
            async callback(action = '', pluginName) {
                const actor = new Actor();
                await actor.run({ action, pluginName });
            }
        });
    };
}
