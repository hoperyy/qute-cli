import * as fs from 'fs';
import * as path from 'path';
import fse from 'fs-extra';
import md5 from 'md5';
import baseUtil from 'qute-cli-util';
import PluginUtil from '../util';

const { logUtil, pathUtil } = baseUtil;
const pluginUtil = new PluginUtil();

export default () => {
    const cacheFolder = pathUtil.cacheFolder;
    const linkedPluginsFolder = pluginUtil.getLinkedPluginsFolder();
    const cwd = process.cwd();
    const target = path.join(linkedPluginsFolder, md5(cwd));

    if (fs.existsSync(target)) {
        fse.removeSync(target);
    }

    logUtil.logGreen('已移除当前项目对 qute 插件的映射。');
};

