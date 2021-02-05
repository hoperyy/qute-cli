import * as fs from 'fs';
import * as path from 'path';
import md5 from 'md5';
import fse from 'fs-extra';
import readdirSync from 'recursive-readdir-sync';
import arrayDiff from 'simple-array-diff';
import extract from 'extract-zip';
import getNpmPackageVersion from 'get-npm-package-version';

import pathUtil from './path';
import npmUtil from './npm';
import logUtil from './log';
class Scaffold {
    constructor() {};

    private createExecPackageJsonFile(execInstallFolder, scaffoldName) {
        const pkgJsonPath = path.join(execInstallFolder, 'package.json');

        fse.ensureFileSync(pkgJsonPath);
        fse.writeFileSync(pkgJsonPath, JSON.stringify({
            name: `installing-${scaffoldName}`,
            version: '1.0.0',
        }));
    };

    /**
     * @func
     * @desc get dir path of scaffold wrapper
     * @param {String} scaffoldName
     * @return {String} scaffold wrapper path
     */
    public getScaffoldWrapper() {
        return path.join(pathUtil.cacheFolder, 'scaffold');
    };

    /**
     * @func
     * @desc get dir path for execing installing scaffold
     * @param {String} scaffoldName
     * @return {String} dir path for execing installing scaffold
     */
    public getScaffoldInstallFolder(scaffoldName, scaffoldVersion) {
        return path.join(this.getScaffoldWrapper(), `install-scaffold/${md5(scaffoldName + '@' + scaffoldVersion)}`);
    };

    /**
     * @func
     * @desc get scaffold dir path
     * @param {String} scaffoldName
     * @return {String} scaffold dir path
     */
    public getScaffoldFolder(scaffoldName, scaffoldVersion) {
        if (scaffoldVersion) {
            return path.join(this.getScaffoldWrapper(), `${scaffoldName}@${scaffoldVersion}`);
        } else {
            return path.join(this.getScaffoldWrapper(), scaffoldName);
        }
    };

    /**
     * @func
     * @desc get workspace dir path
     * @param {Object}
     * @param {String} object.cwd: current project path
     * @param {String} object.scaffoldName
     * @return {String} workspace dir path
     */
    public getWorkspaceFolder({ cwd, scaffoldName, scaffoldVersion }) {
        const currentDirname = cwd.replace(path.dirname(cwd), '').replace(/^\//, '').replace(/\/$/, '');
        const scaffoldFolder = this.getScaffoldFolder(scaffoldName, scaffoldVersion);
        const workspaceFolder = path.join(scaffoldFolder, 'workspace', md5(cwd), currentDirname);
        return workspaceFolder;
    };

    public getScaffoldPkgJsonInfo(scaffoldName, scaffoldVersion) {
        const pkg = path.join(this.getScaffoldFolder(scaffoldName, scaffoldVersion), 'package.json');
        if (!fs.existsSync(pkg)) {
            return null;
        }

        return JSON.parse(fs.readFileSync(pkg, 'utf8'));
    };

    public getScaffoldInfoFromConfigFile() {
        const cwd = process.cwd();
        let scaffoldName = '';
        let scaffoldVersion = 'default'; // 默认版本 

        const pkgFile = path.join(cwd, 'package.json');

        try {
            scaffoldName = JSON.parse(fs.readFileSync(pkgFile, 'utf-8').toString())['qute-scaffold'];
        } catch (err) {
            // eslint-disable-no-empty
        }

        return { scaffoldName, scaffoldVersion };
    };

    public getForceCompileFromConfigFile() {
        const cwd = process.cwd();
        let result = () => { };
        const configFile = path.join(cwd, 'qute.config.js');

        try {
            if (fs.existsSync(configFile)) {
                result = (require(configFile).quteForceSync) || (() => { });
            }
        } catch (err) { }

        return result;
    };

    public preInstall() { };

    public getFullName(scaffoldName) {
        return scaffoldName;
    };

    public getShortName(scaffoldName) {
        return scaffoldName;
    };

    /**
     * @func
     * @desc ensure scaffold latest
     * @param {String} scaffoldName
     */
    public async ensureScaffoldInstalled(scaffoldName, scaffoldVersion) {
        if (!this.isScaffoldExists(scaffoldName, scaffoldVersion)) {
            logUtil.start(`installing scaffold ${scaffoldName}...`);
            await this.installScaffold(scaffoldName, scaffoldVersion);
            logUtil.stop();
            return;
        }

        if (scaffoldVersion === 'latest' && this.isScaffoldOutdate(scaffoldName)) {
            logUtil.start(`updating scaffold ${scaffoldName}...`);
            await this.installScaffold(scaffoldName, scaffoldVersion);
            logUtil.stop();
        }
    };

    /**
     * @func
     * @private
     * @desc check whether scaffold is outdated
     * @param {String} scaffoldName
     * @return {Boolean}
     */
    private isScaffoldOutdate(scaffoldName) {
        const packagejsonFilePath = path.join(this.getScaffoldFolder(scaffoldName, 'latest'), 'package.json');

        const obj = JSON.parse(fs.readFileSync(packagejsonFilePath).toString());

        const currentVersion = obj.version;
        
        const latestVersion = getNpmPackageVersion(scaffoldName, { registry: npmUtil.npmRegistry, timeout: 2000 });

        if (latestVersion) {
            if (currentVersion !== latestVersion) {
                console.log(`\nscaffold ${scaffoldName} is outdated, details as below:\n`);
                console.log('  - scaffoldName: ', scaffoldName);
                console.log('  - currentVersion: ', currentVersion);
                console.log('  - latestVersion: ', latestVersion, '\n');
                return true;
            }
            return false;
        }

        return false;
    };

    /**
     * @func
     * @desc check whether scaffold exists
     * @param {String} scaffoldName
     * @return {Boolean}
     */
    public isScaffoldExists(scaffoldName, scaffoldVersion) {
        const scaffoldFolder = this.getScaffoldFolder(scaffoldName, scaffoldVersion);
        const pkg = path.join(scaffoldFolder, 'package.json');

        if (!fs.existsSync(pkg)) {
            return false;
        }

        return true;
    };

    /**
     * @func
     * @desc get dir path for execing installing scaffold
     * @param {String} scaffoldName
     * @return {String} dir path for execing installing scaffold
     */
    getScaffoldExecInstallFolder(scaffoldName) {
        return path.join(this.getScaffoldWrapper(), 'tmp-install-cache', `${md5(scaffoldName)}`);
    };

    /**
     * @func
     * @desc install scaffold
     * @param {String} scaffoldName
     */
    installScaffold(scaffoldName, scaffoldVersion) {
        const execInstallFolder = this.getScaffoldExecInstallFolder(scaffoldName);
        const child = require('child_process');

        // ensure exec dir
        fse.ensureDirSync(execInstallFolder);

        // ensure package.json exists
        this.createExecPackageJsonFile(execInstallFolder, scaffoldName);

        const order = `cd ${execInstallFolder} && npm --registry ${npmUtil.npmRegistry} install ${scaffoldName}@${scaffoldVersion} --no-optional`;

        try {
            child.execSync(order, { stdio: 'inherit' });
            this.moveScaffoldCache(scaffoldName, scaffoldVersion);
        } catch (err) {
            console.log(`\nError occurred when "npm --registry ${npmUtil.npmRegistry} install ${scaffoldName}@${scaffoldVersion}"\n`.red);
            process.exit(1);
        }
    };

    moveScaffoldCache(scaffoldName, scaffoldVersion) {
        const execInstallFolder = this.getScaffoldExecInstallFolder(scaffoldName);
        const scaffoldFolder = this.getScaffoldFolder(scaffoldName, scaffoldVersion);

        const srcScaffold = path.join(execInstallFolder, 'node_modules', scaffoldName);
        const srcScaffoldDep = path.join(execInstallFolder, 'node_modules');

        if (!fs.existsSync(srcScaffold) || !fs.existsSync(srcScaffoldDep)) {
            return;
        }

        if (fs.existsSync(scaffoldFolder)) {
            fse.removeSync(scaffoldFolder);
        }

        // move scaffold
        fse.moveSync(srcScaffold, scaffoldFolder, {
            overwrite: true,
        });

        ['package-lock.json', 'package.json'].forEach(name => {
            const src = path.join(scaffoldFolder, `.${name}`);
            const target = path.join(scaffoldFolder, name);

            if (fs.existsSync(src)) {
                if (fs.existsSync(target)) {
                    fse.removeSync(target);
                }
                fse.copySync(src, target);
            }
        });

        // run npm install
        logUtil.start('installing dependencies...');
        require('child_process').execSync(`cd ${scaffoldFolder} && npm i --registry ${npmUtil.npmRegistry} --silent`);
        logUtil.stop();

        fse.removeSync(execInstallFolder);
    };

    isScaffoldAvalible(scaffoldName, scaffoldVersion) {
        const scaffoldPath = this.getScaffoldFolder(`${this.getFullName(scaffoldName)}`, scaffoldVersion);
        console.log(scaffoldPath)
        return fs.existsSync(path.join(scaffoldPath, 'qute-entry.js'));
    };
}

export default new Scaffold();