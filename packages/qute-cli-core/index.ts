import { PluginAnything } from 'plugin-anything';
import * as path from 'path';
import * as fs from 'fs';
import commander from 'commander';

import baseUtil from 'qute-cli-util';

import PluginInit from './plugins/plugin-init';
import PluginMock from './plugins/plugin-mock';
import PluginPlugin from './plugins/plugin-plugin';
import PluginRun from './plugins/plugin-run';
import PluginQuickOrders from './plugins/plugin-quick-orders';
import PluginShow from './plugins/plugin-show';

import PluginPluginAction from './plugins/plugin-plugin/src/action';
import PluginMockAction from './plugins/plugin-mock/action';
import PluginInitAction from './plugins/plugin-init/action';
import PluginRunAction from './plugins/plugin-run/action';

const { pathUtil, scaffoldUtil, logUtil } = baseUtil;

export default class Core extends PluginAnything {
    constructor() {
        super();

        this.oldProcessArgv = [...process.argv];

        (async () => {
            if (this.oldProcessArgv.length >= 3 && this.isPlugin(this.oldProcessArgv[2])) { // 按需插件式写法 qute qute-plugin- xx
                await this.lazyLoad();
            } else { // 正常的命令式写法
                await this.unlazyload();
            }
            this.initCommander();
        })();
    };

    public utils = baseUtil;

    // 默认提供内置指令的一些 hook
    public hooks = {
        beforeInit: this.createHook(),
        afterInit: this.createHook(),
        beforeRun: this.createHook(),
        afterRun: this.createHook(),
    };

    public existedCommanders = {};

    public registerCommander(commanderStr, { description = '', options = [], callback = (...args) => {} }) {
        let c: any = commander;

        c = c.command(commanderStr).allowUnknownOption();

        if (description) {
            c = c.description(description);
        }

        if (options && options.length) {
            for (let i = 0, len = options.length; i < len; i++) {
                const option = options[i];
                c = c.option(option[0], option[1]);
            }
        }

        c.action(callback);
    };

    private oldProcessArgv = [];

    private newProcessArgv = [];

    private async lazyLoad() {
        const pluginName = this.formatPluginName(this.oldProcessArgv[2]);

        // 如果当前目录没有插件依赖，则全局安装
        if (!fs.existsSync(path.join(process.cwd(), 'node_modules', pluginName))) {
            // 安装插件
            const actor = new PluginPluginAction();
            await actor.run({ action: 'add', pluginName });
        } else {
            logUtil.logGreen(`插件 ${pluginName.green} 在当前目录已安装，使用当前目录已安装的版本`);
        }

        this.newProcessArgv = [ ...this.oldProcessArgv.slice(0, 2), ...this.oldProcessArgv.slice(3) ];

        const userPlugins = await this.getUserPlugins();
        this.plugins = [...userPlugins, pluginName, ...this.plugins];

        this.installPlugins({
            plugins: this.plugins,
            searchList: [
                path.join(process.cwd(), 'node_modules'), // 优先使用当前目录的版本
                path.join(pathUtil.pluginCacheFolder, 'installed', 'node_modules'),
                path.join(pathUtil.pluginCacheFolder, 'linked'),
            ],
        });
    };

    private formatPluginName(name) {
        if (name.indexOf('qute-plugin-') == 0) {
            return name;
        }

        if (name.indexOf('plugin-') == 0) {
            return `qute-${name}`;
        }

        return name;
    };

    // 获取用户配置的 plugin
    // class PluginA {
    //     constructor(options) {
    //         this.options = options
    //     }

    //     apply({ hooks, createHook, registerCommander }) {
    //         const options = this.options;
    //         registerCommander('hi [name]', {
    //             description: 'hi',
    //             async callback(name) {
    //                 console.log(`hi, my name is ${name || options.name}`);
    //             }
    //         });
    //     };
    // }
    // module.exports = [
    //     [PluginA, { name: 'lily' }]
    // ]
    private async getUserPlugins() {
        const cwd = process.cwd();
        const configFile = path.join(cwd, 'qute.plugin.js');
        let userPlugins = [];
        
        if (fs.existsSync(configFile)) {
            userPlugins = require(configFile);
        }

        return userPlugins;
    };

    private async unlazyload() {
        this.newProcessArgv = [...this.oldProcessArgv];

        // 从插件目录里获取 plugins 列表
        const installedPlugins: Array<string> = this.getInstalledPlugins();
        const linkedPlugins: Array<string> = this.getLinkedPlugins();

        const userPlugins = await this.getUserPlugins();

        // 顺序上优先 userPlugins
        this.plugins = [...userPlugins, ...linkedPlugins, ...installedPlugins, ...this.plugins];

        this.installPlugins({
            plugins: this.plugins,
            searchList: [
                path.join(process.cwd(), 'node_modules'), // 优先使用当前目录的版本
                path.join(__dirname, 'node_modules'),
                path.join(pathUtil.pluginCacheFolder, 'installed', 'node_modules'),
                path.join(pathUtil.pluginCacheFolder, 'linked'),
            ],
        });
    };

    private async initCommander() {
        if (this.oldProcessArgv.length === 2) {
            const mockAction = new PluginMockAction();
            const initAction = new PluginInitAction({
                scaffoldName: 'qute-scaffold-templates'
            });
            const runAction = new PluginRunAction();

            if (!scaffoldUtil.getScaffoldInfoFromConfigFile().scaffoldName) {
                await initAction.run();
            }

            mockAction.run();
            
            await runAction.run('dev-daily', { watch: true });
        } else {
            commander.allowUnknownOption();
            commander.on('command:*', async () => {
                console.error(`Invalid command: ${'%s'.yellow}\nSee list of available commands by ${'qute help'.green}.`, commander.args.join(' '));
                process.exit(1);
            });

            // console.log(commander);
            commander.parse(this.newProcessArgv);
        }
    };

    private plugins: Array<Array<any> | string> = [
        [ PluginInit ],
        [ PluginRun ],
        [ PluginMock ],
        [ PluginPlugin ],
        [ PluginQuickOrders ],
        [ PluginShow ],
    ];

    private getPluginsFromPkg(pkgFilePath) {
        const result = [];

        if (!fs.existsSync(pkgFilePath)) {
            return result;
        }

        const pkgJson = fs.readFileSync(pkgFilePath, 'utf8');

        const pkgObj = JSON.parse(pkgJson);
        const deps = Object.keys(pkgObj.dependencies);

        for (let i = 0, len = deps.length; i < len; i++) {
            const curDep = deps[i];

            if (this.isPlugin(curDep)) {
                result.push(curDep);
            }
        }

        return result;
    };

    private isPlugin(name) {
        return name.indexOf('qute-plugin-') === 0 || name.indexOf('plugin-') === 0;
    };

    private getInstalledPlugins() {
        try {
            const pluginCacheFolder = pathUtil.pluginCacheFolder;
            const result = [];
            const pkgJsonPath = path.join(pluginCacheFolder, 'installed', 'package.json');
            result.push(...this.getPluginsFromPkg(pkgJsonPath));
            return result;
        } catch (err) {
            return [];
        }
    };

    private getLinkedPlugins() {
        try {
            const pluginCacheFolder = pathUtil.pluginCacheFolder;
            const result = [];
            const curType = 'linked';
            const linkedFolderPath = path.join(pluginCacheFolder, curType);
            const subFiles = fs.readdirSync(linkedFolderPath);

            for (let i = 0, len = subFiles.length; i < len; i++) {
                const name = `${subFiles[i]}`;
                
                if (this.isPlugin(name) && fs.statSync(path.join(pluginCacheFolder, curType, name)).isDirectory()) {
                    result.push(name);
                }
            }

            return result;
        } catch(err) {
            return [];
        }
    };
};