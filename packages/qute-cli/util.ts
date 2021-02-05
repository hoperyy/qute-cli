import 'colors';

import * as fs from 'fs';
import * as path from 'path';
import fse from 'fs-extra';
import detectFileContent from 'detect-file-content';
import ensureModuleLatest from 'ensure-module-latest';

import { BaseUtil } from 'qute-cli-util';

export default class Util extends BaseUtil {
    pathUtil: any;
    processUtil: any;
    constructor() {
        super();
    }

    public setInstallStatus(status) {
        fse.ensureFileSync(this.pathUtil.statusFilePath);
        fs.writeFileSync(this.pathUtil.statusFilePath, status, 'utf8');
    };

    public getInstallStatus() {
        fse.ensureFileSync(this.pathUtil.statusFilePath);
        const content = fs.readFileSync(this.pathUtil.statusFilePath, 'utf-8');
        return content || 'blank';
    };

    public async detectFile() {
        const installStatus = this.getInstallStatus();
        if (installStatus === 'blank') {
            return;
        }

        let reg = /(pending)|(resolved)|(rejected)/i;

        switch (installStatus) {
            case 'checking': 
                reg = /(pending)|(resolved)|(rejected)/i;
                break;
            case 'pending':
                reg = /(resolved)|(rejected)/i;
                break;
            default:
                break;
        }

        const detectResult = await detectFileContent({
            filePath: this.pathUtil.statusFilePath,
            maxTimes: 1 * 60, // 1 min
            internalTime: 1000, // 1s
            matchReg: reg,
        });

        if (!detectResult.success) {
            this.setInstallStatus('rejected');
            process.exit(1);
        }
    }

    public async run(isTest = false) {
        if (isTest) {
            this.setInstallStatus('checking');
            try {
                const Core = require(path.join(__dirname, '../qute-cli-core/index.js')).default;
                new Core();
                this.setInstallStatus('resolved');
            } catch(err) {
                console.log(err);
            }
        } else {
            this.setInstallStatus('checking');
            const modulePath = await ensureModuleLatest({
                moduleName: 'qute-cli-core',
                cwd: this.pathUtil.cmdCacheFolder,
                silent: false,
                beforeInstall: (cwd) => {
                    if (fs.existsSync(cwd)) {
                        try {
                            fse.removeSync(cwd);
                        } catch (err) {

                        }
                    }

                    this.setInstallStatus('pending');
                },
            });

            this.setInstallStatus('resolved');
            require(modulePath).default();
        }
    }
}