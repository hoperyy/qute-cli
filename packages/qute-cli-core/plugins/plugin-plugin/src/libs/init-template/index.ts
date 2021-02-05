export default class Plugin {
    constructor() { };

    apply({ hooks, createHook, registerCommander, existedCommanders }): void {
        // 内置命令的执行方法
        const { run, init } = existedCommanders;

        if (hooks.beforeInit) {
            hooks.beforeInit.tap('before init', async () => {
                console.log('拦截 init 执行前');

                // 如果为 true 则会禁用掉 init 指令
                return { disabled: false };
            });
        }

        if (hooks.afterInit) {
            hooks.afterInit.tap('before init', async () => {
                console.log('拦截 init 执行后');
            });
        }

        registerCommander('hello [param]', {
            description: 'plugin',
            options: [
                ['-t, --test', '测试参数']
            ],
            async callback(param, options) {
                console.log('我的插件开始运行了');
            }
        });
    };
}
