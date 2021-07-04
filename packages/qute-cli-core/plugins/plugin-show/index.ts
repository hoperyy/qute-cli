import * as childProcess from 'child_process';

import baseUtil from 'qute-cli-util';
const {scaffoldUtil, logUtil } = baseUtil;

export default class Show {
    constructor() { };

    analyze(configStr) {
        // 获取被指定的版本
        const str = configStr.replace(/(\'|\")/g, '');
        let scaffoldName = '';
        let scaffoldVersion = 'default';

        if (/\@/.test(str)) {
            const atIndex = str.lastIndexOf('@');
            if (atIndex !== 0) {
                scaffoldVersion = str.substring(atIndex + 1);
                scaffoldName = str.substring(0, atIndex);
            } else {
                scaffoldName = str;
            }
        } else {
            scaffoldName = str;
        }

        return { scaffoldName, scaffoldVersion };
    };

    apply({ hooks, createHook, registerCommander, existedCommanders }): void {
        const { run } = existedCommanders;

        registerCommander('show [scaffoldName]', {
            description: '本地 dev',
            callback: async (scaffoldName) => {
                let scaffoldVersion = 'default';

                if (scaffoldName) {
                    const analyzedObj = this.analyze(scaffoldName);

                    scaffoldName = analyzedObj.scaffoldName;
                    scaffoldVersion = analyzedObj.scaffoldVersion;
                } else {
                    logUtil.logGreen(`从当前目录获取脚手架信息`);
                    const config = scaffoldUtil.getScaffoldInfoFromConfigFile();
                    scaffoldVersion = config.scaffoldVersion;
                    scaffoldName = config.scaffoldName;
                }

                if (!scaffoldName) {
                    logUtil.logRed('当前目录没有脚手架信息');
                    return;
                }

                const fullScaffoldName = scaffoldUtil.getFullName(scaffoldName);

                if (scaffoldVersion === 'default') {
                    scaffoldVersion = 'latest';
                }

                const scaffoldFolder = scaffoldUtil.getScaffoldFolder(fullScaffoldName, scaffoldVersion);

                // 判断脚手架是否已安装
                if (scaffoldUtil.isScaffoldExists(fullScaffoldName, scaffoldVersion)) {
                    logUtil.logGreen(`脚手架路径: ${scaffoldFolder}`);
                    childProcess.execSync(`cd ${scaffoldFolder} && open .`);
                } else {
                    logUtil.logRed(`脚手架路径 ${scaffoldFolder} 不存在`);
                }
            }
        });
    };
}
