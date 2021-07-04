import * as fs from 'fs';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as inquirer from 'inquirer';
import baseUtil from 'qute-cli-util';

const { scaffoldUtil, fileUtil, logUtil } = baseUtil;

export default class Action {
    constructor({ scaffoldName }) {
        this.scaffoldName = scaffoldName;
    };

    private scaffoldName = '';

    public async run() {
        const cwd = process.cwd();

        const analyzedObj = this.analyzeScaffoldStr(this.scaffoldName);

        let fullScaffoldName = scaffoldUtil.getFullName(analyzedObj.scaffoldName);
        const scaffoldVersion = analyzedObj.scaffoldVersion;

        logUtil.start('checking...');

        // 如果当前项目是空目录
        if (fileUtil.isEmptyDir({ dir: cwd })) {
            logUtil.stop()

            // ensure latest scaffold
            await scaffoldUtil.ensureScaffoldInstalled(fullScaffoldName, scaffoldVersion);
            if (!scaffoldUtil.isScaffoldAvalible(fullScaffoldName, scaffoldVersion)) {
                logUtil.fail(`"${fullScaffoldName}" is not formatted with qute`);
                return;
            }
            const isSuccessful = await this.downloadTemplate(cwd, fullScaffoldName, scaffoldVersion);
            fileUtil.renameInvisableFiles(cwd);

            if (!isSuccessful) {
                logUtil.fail(`Init project with scaffold ${fullScaffoldName.green} failed!`);
            } else {
                logUtil.succeed(`Init project with scaffold ${fullScaffoldName.green} successfully!`);
            }


        } else {
            logUtil.warn(`Project initialization was skipped because current folder is not empty.`);
        }
    };

    analyzeScaffoldStr(str) {
        let rt = {
            scaffoldName: str,
            scaffoldVersion: 'latest'
        };

        if (/\@/.test(str)) {
            const atIndex = str.lastIndexOf('@');
            if (atIndex !== 0) {
                rt.scaffoldVersion = str.substring(atIndex + 1);
                rt.scaffoldName = str.substring(0, atIndex);
            } else {
                rt.scaffoldName = str;
            }
        } else {
            rt.scaffoldName = str;
        }

        return rt;
    };

    /**
     * @thunk function
     * @desc get template path
     * @param {String} scaffoldName scaffold name(full name)
     * @return {String} template path
     */
    private async getTemplateDirPath(scaffoldName, scaffoldVersion, chosenName?) {
        const step1 = (folder) => {
            return new Promise(resolve => {
                const templateNames = [];

                if (fs.existsSync(folder)) {
                    fs.readdirSync(folder).forEach((filename) => {
                        const demoPath = path.join(folder, filename);
                        if (fs.statSync(demoPath).isDirectory()) {
                            templateNames.push(filename);
                        }
                    });
                }

                // qute-demo 目录下只要有文件夹，就作为选项提示
                if (chosenName) {
                    resolve(path.join(folder, chosenName));
                } else {
                    inquirer.prompt([{
                        type: 'list',
                        name: 'chosen',
                        message: 'choose template:',
                        choices: templateNames,
                    }]).then((answers) => {
                        const chosenTemplateName = answers.chosen;
                        resolve(path.join(folder, chosenTemplateName));
                    });
                }
            });
        };

        const step2 = (folder) => {
            return new Promise(resolve => {
                const templateNames = [];

                if (fs.existsSync(folder)) {
                    fs.readdirSync(folder).forEach((filename) => {
                        if (/^qute-demo/.test(filename)) {
                            const demoPath = path.join(folder, filename);
                            if (fs.statSync(demoPath).isDirectory()) {
                                templateNames.push(filename);
                            }
                        }
                    });
                }

                // 各级子目录中，如果没有 qute-demo 目录，就直接复制过去
                if (templateNames.length === 0) {
                    resolve(folder);
                } else {
                    // ask user to choose demo
                    console.log('');
                    inquirer.prompt([{
                        type: 'list',
                        name: 'chosen',
                        message: 'choose template',
                        choices: templateNames.map(item => item.replace(/^qute\-demo\-?/, '')),
                    }]).then((answers) => {
                        const chosenTemplateName = `qute-demo-${answers.chosen}`;
                        resolve(path.join(folder, chosenTemplateName));
                    });
                }
            });
        };

        const scaffoldFolder = scaffoldUtil.getScaffoldFolder(scaffoldName, scaffoldVersion);
        const demoFolder = path.join(scaffoldFolder, 'project-template');

        const step1Folder = await step1(demoFolder);
        const step2Folder = await step2(step1Folder);

        return step2Folder;
    };

    /**
     * @func
     * @desc download template to current dir
     * @param {String} current dir path
     * @param {String} scaffoldName scaffold name(full name)
     */
    private async downloadTemplate(cwd, scaffoldName, scaffoldVersion, chosenName?) {
        if (!scaffoldUtil.isScaffoldAvalible(scaffoldName, scaffoldVersion)) {
            console.log(`\nScaffold "${scaffoldName}" is not formatted with qute.`.yellow);
            return false;
        }

        // get demo from scaffold
        const targetTemplateDirPath = await this.getTemplateDirPath(scaffoldName, scaffoldVersion, chosenName);
        if (targetTemplateDirPath === '') {
            console.log(`\nScaffold "${scaffoldName}" has no demo files. \n\nPlease contact the scaffold author to add demo files or check whether you've input the right scaffold name.\n`.red);
            return false;
        }

        // copy template to cwd
        fse.copySync(targetTemplateDirPath, cwd, {
            overwrite: true,
            errorOnExist: false,
        });

        return true;
    };
}