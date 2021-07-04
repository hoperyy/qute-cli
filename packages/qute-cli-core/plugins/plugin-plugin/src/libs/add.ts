import * as fs from 'fs';
import * as path from 'path';
import fse from 'fs-extra';
import baseUtil from 'qute-cli-util';

import PluginUtil from '../util';
const pluginUtil = new PluginUtil();
const { logUtil } = baseUtil;

const ensureNecessaryFiles = () => {
    const installedPluginsFolder = pluginUtil.getInstalledPluginsFolder();
    const packageJsonFilePath = path.join(installedPluginsFolder, 'package.json');

    if (fs.existsSync(packageJsonFilePath)) {
        return;
    }

    fse.ensureDirSync(installedPluginsFolder);

    const packageJsonContent = JSON.stringify({
        name: 'qute-plugins',
        description: "qute 插件集合",
        version: "1.0.0"
    }, null, '\t');

    fse.ensureFileSync(packageJsonFilePath);

    fs.writeFileSync(packageJsonFilePath, packageJsonContent);
};

export default ({ pluginName }) => {
    if (!pluginName) {
        logUtil.logRed(`插件包名必须存在: ${'qute plugin add <pluginName>'.green}`);
        return;
    }

    pluginName = pluginUtil.getFullPluginName(pluginName);
    ensureNecessaryFiles();
    pluginUtil.ensurePluginLatest(pluginName, true);
};

