import registryUrl from 'registry-url';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';

import logUtil from './log';

const currentRegistry = registryUrl()

class Npm {
    constructor() {}

    // user registry by default
    scaffoldRegistry = currentRegistry;

    npmRegistry = currentRegistry;

    runNpmInstall({ showLog } = { showLog: false }) {
        const cwd = process.cwd();
        if (fs.existsSync(path.join(cwd, 'package.json'))) {
            logUtil.start('npm installing...');
            try {
                if (showLog) {
                    require('child_process').execSync(`cd ${cwd} && npm i --silent --registry=${this.npmRegistry}`, { stdio: 'inherit' });
                } else {
                    require('child_process').execSync(`cd ${cwd} && npm i --silent --registry=${this.npmRegistry}`);
                }
            } catch (err) {
                logUtil.fail('npm installation failed.');
                console.log(err.message);
                logUtil.clear();
                return;
            }

            logUtil.stop();
        }
    };
}

export default new Npm();