import * as fs from 'fs';
import * as path from 'path';
import fse from 'fs-extra';
import md5 from 'md5';
import baseUtil from 'qute-cli-util';
import PluginUtil from '../util';

const { logUtil, pathUtil } = baseUtil;
const pluginUtil = new PluginUtil();

export default () => {
    const linkedPluginsFolder = pluginUtil.getLinkedPluginsFolder();
    const cwd = process.cwd();

    const pkgJsonPath = path.join(cwd, 'package.json');

    let pluginName = '';

    if (fs.existsSync(pkgJsonPath)) {
        const pkgObj = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        pluginName = pkgObj.name || '';

        if (!pluginName) {
            logUtil.logYellow('package.json 文件缺失 name 字段');
        } else {
            const target = path.join(linkedPluginsFolder, pluginName);

            if (fs.existsSync(target)) {
                fse.removeSync(target);
            }

            fse.ensureSymlinkSync(cwd, target);
            console.log(target);
            logUtil.logGreen('已将当前项目映射为 qute 插件');
        }
    } else {
        logUtil.logYellow('当前项目缺失 package.json 文件');
    }
};

