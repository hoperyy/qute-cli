import * as fs from 'fs';
import * as path from 'path';
import fse from 'fs-extra';
import md5 from 'md5';
import baseUtil from 'qute-cli-util';
import PluginUtil from '../util';

const { logUtil } = baseUtil;
const pluginUtil = new PluginUtil();

export default ({ pluginName }) => {
    const fullPluginName = pluginUtil.getFullPluginName(pluginName);
    const installedPluginsFolder = pluginUtil.getInstalledPluginsFolder();

    if (!fs.existsSync(path.join(installedPluginsFolder, 'node_modules', fullPluginName))) {
        logUtil.logYellow(`${fullPluginName.green} 没有安装，无需删除`);
        return;
    }

    logUtil.start(`正在删除 ${fullPluginName.green}`);
    require('child_process').execSync(`cd ${installedPluginsFolder} && npm uninstall ${fullPluginName} --save --silent`);
    logUtil.succeed(`插件 ${fullPluginName.green} 删除成功！`).stop();
};

