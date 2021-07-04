import * as fs from 'fs';
import * as path from 'path';

import getNpmPackageVersion from 'get-npm-package-version';

import baseUtil from 'qute-cli-util';

const { pathUtil, logUtil } = baseUtil;

export default class Util {
    getFullPluginName(pluginName) {
        if (pluginName.indexOf('qute-plugin-') === -1) {
            pluginName = `qute-plugin-${pluginName}`;
        }

        return pluginName;
    };
    getPluginsFolder() {
        return path.join(pathUtil.cacheFolder, 'plugins');
    };
    getInstalledPluginsFolder() {
        return path.join(this.getPluginsFolder(), 'installed');
    };
    getLinkedPluginsFolder() {
        return path.join(this.getPluginsFolder(), 'linked');
    };

    getEntryFilePath(pluginFolder) {
        const pkgJsonPath = path.join(pluginFolder, 'package.json');
        const pkgJsonObj = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        const name = pkgJsonObj.name;

        const indexFilePath = (pkgJsonObj.main && fs.existsSync(path.join(pluginFolder, pkgJsonObj.main))) ? path.join(pluginFolder, pkgJsonObj.main) : path.join(pluginFolder, 'index.js');

        return indexFilePath;
    };

    getPluginFolder(pluginName) {
        return path.join(this.getInstalledPluginsFolder(), 'node_modules', pluginName);
    };

    isPluginExisted(pluginName) {
        const folder = this.getPluginFolder(pluginName);
        if (fs.existsSync(path.join(folder, 'package.json')) && fs.existsSync(this.getEntryFilePath(folder))) {
            return true;
        }
        return false;
    };

    isPluginOutdated(pluginName) {
        const folder = this.getPluginFolder(pluginName);
        const pkgFile = path.join(folder, 'package.json');

        try {
            const curVersion = JSON.parse(fs.readFileSync(pkgFile, 'utf8')).version;
            logUtil.start(`检查插件 ${pluginName} 是否有更新`);
            const latestVersion = getNpmPackageVersion(pluginName);
            logUtil.succeed(`插件 ${pluginName} ${curVersion !== latestVersion ? '有更新' : '已是最新'}`);
            if (curVersion !== latestVersion) {
                return true;
            }

            return false;
        } catch (err) {
            return false;
        }
    };

    ensurePluginLatest(pluginName, isInstall = false) {
        const installedPluginsFolder = this.getInstalledPluginsFolder();

        let isExisted = this.isPluginExisted(pluginName);
        const isOutdated = this.isPluginOutdated(pluginName);

        if (isExisted && !isOutdated) {
            // isInstall && logUtil.logYellow(`插件 ${pluginName} 已是最新版本，无需重复安装`);
            return;
        }

        let desc = '安装';

        if (!isExisted) {
            desc = '安装';
        } else if (isOutdated) {
            desc = '更新';
        }

        logUtil.start(`正在${desc}插件 ${pluginName.green}...\n`);

        try {
            require('child_process').execSync(`cd ${installedPluginsFolder} && npm i ${pluginName}@latest --registry=http://npm.idcvdian.com`, {
                stdio: 'inherit'
            });
            logUtil.succeed(`插件 ${pluginName} ${desc}成功`).stop();
        } catch (err) {
            logUtil.fail(`插件 ${pluginName.green} ${desc}失败`).stop();
        }
    };
};

