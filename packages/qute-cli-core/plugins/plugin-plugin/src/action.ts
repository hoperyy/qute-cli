import * as fs from 'fs';
import * as path from 'path';
import baseUtil from 'qute-cli-util';
import actionInit from './libs/init';
import actionAdd from './libs/add';
import actionLink from './libs/link';
import actionUnlink from './libs/unlink';
import actionList from './libs/list';
import actionRemove from './libs/remove';

const { pathUtil, scaffoldUtil, logUtil } = baseUtil;

const pluginUtil = require('./util');

const registedPluginMap = {};

export default class Action {
    constructor() {

    };

    registPlugin(commander) {
        const _registOnePlugin = (pluginFolder, type) => {
            const pkgJsonPath = path.join(pluginFolder, 'package.json');
            const pkgJsonObj = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
            const name = pkgJsonObj.name;

            const indexFilePath = pluginUtil.getEntryFilePath(pluginFolder);

            if (registedPluginMap[name]) {
                logUtil.logYellow(`插件 ${name.green} 已经本地 link 过，忽略安装的版本`);
                return;
            }

            try {
                if (type === 'installed') {
                    pluginUtil.ensurePluginLatest(path.join('@vdian', path.basename(pluginFolder)));
                }

                const { scaffoldName, scaffoldVersion } = scaffoldUtil.getScaffoldInfoFromConfigFile();
                const workspaceFolder = scaffoldUtil.getWorkspaceFolder({ cwd: process.cwd(), scaffoldName, scaffoldVersion });

                require(indexFilePath)({
                    commander,
                    context: {
                        cacheFolder: pathUtil.cacheFolder,
                        workspaceFolder,
                        scaffoldName,
                        scaffoldVersion
                    }
                    // vbuilderCacheFolder: pathUtil.cacheFolder
                });
                registedPluginMap[name] = true;
            } catch (err) {
                console.log(err);
            }
        };

        const _registInstalledPlugins = () => {
            const installedPluginsFolder = pluginUtil.getInstalledPluginsFolder();
            const pluginsParentFolder = path.join(installedPluginsFolder, 'node_modules/@vdian');

            if (!fs.existsSync(pluginsParentFolder)) {
                return;
            }

            fs.readdirSync(pluginsParentFolder).forEach(dirname => {
                if (/qute\-plugin/.test(dirname)) {
                    _registOnePlugin(path.join(pluginsParentFolder, dirname), 'installed');
                }
            });
        };

        const _registLinkedPlugins = () => {
            const linkedPluginsFolder = pluginUtil.getLinkedPluginsFolder();

            if (!fs.existsSync(linkedPluginsFolder)) {
                return;
            }

            fs.readdirSync(linkedPluginsFolder).forEach(hashedName => {
                try {
                    const hashedFolder = path.join(linkedPluginsFolder, hashedName);
                    const subfiles = fs.readdirSync(hashedFolder);

                    let pluginFolderName = '';

                    for (let i = 0; i < subfiles.length; i++) {
                        const filename = subfiles[i];
                        const folder = path.join(hashedFolder, filename);

                        if (fs.existsSync(folder) && fs.statSync(folder).isDirectory() && fs.existsSync(pluginUtil.getEntryFilePath(folder))) {
                            pluginFolderName = filename;
                            break;
                        }
                    }

                    if (pluginFolderName) {
                        _registOnePlugin(path.join(hashedFolder, pluginFolderName), 'link');
                    }
                } catch (err) {

                }
            });
        };

        _registLinkedPlugins();
        _registInstalledPlugins(); // 安装的插件优先级更高，因为可能有命令重复的问题。
    };

    run({ action, pluginName = '' }) {
        const showAllOrders = () => {
            logUtil.logGreen([
                'qute 目前支持的插件命令:\n'.green,
                `${'qute plugin init'.green}: 初始化插件`,
                `${'qute plugin add <pluginName>'.green}: 安装插件`,
                `${'qute plugin install <pluginName>'.green}: 安装插件`,
                `${'qute plugin remove <pluginName>'.green}: 删除插件`,
                `${'qute plugin uninstall <pluginName>'.green}: 删除插件`,
                `${'qute plugin list'.green}: 列举插件`,
                `${'qute plugin link'.green}: 将当前目录映射为插件，常用来开发插件`,
                `${'qute plugin unlink'.green}: 取消当前目录作为 qute 插件的映射`
            ].join('\n'));
        };

        switch (action) {
            case 'install':
            case 'add':
                actionAdd({ pluginName });
                break;
            case 'uninstall':
            case 'remove':
                actionRemove({ pluginName });
                break;
            case 'list':
                actionList();
                break;
            case 'link':
                actionLink();
                break;
            case 'unlink':
                actionUnlink();
                break;
            case 'init':
                actionInit();
                break;
            case '':
                showAllOrders();
                break;
            default:
                logUtil.logRed(`qute plugin ${action.red} 暂不支持。\n`);
                showAllOrders();
                break;
        }
    };
};