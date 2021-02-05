import * as fs from 'fs';
import * as path from 'path';
import fse from 'fs-extra';
import baseUtil from 'qute-cli-util';

const { logUtil, fileUtil } = baseUtil;
import runLink from './link';

export default () => {
    const cwd = process.cwd();

    if (fileUtil.isEmptyDir({ dir: cwd })) {
        fse.copySync(path.join(__dirname, 'init-template'), cwd, { overwrite: true });

        // 修正文件名字 npmignore to .npmignore
        const srcNpmFile = path.join(cwd, 'npmignore');
        const targetNpmFile = path.join(cwd, '.npmignore');

        if (fs.existsSync(srcNpmFile)) {
            fse.moveSync(srcNpmFile, targetNpmFile);
        }

        logUtil.logGreen('qute 插件初始化完成！');

        runLink();

        logUtil.logGreen(`当前目录已注册为 qute 插件，您可以使用自己的插件了`)
    } else {
        logUtil.logYellow(`当前目录不是空目录，无法初始化插件文件`)
    }
};
