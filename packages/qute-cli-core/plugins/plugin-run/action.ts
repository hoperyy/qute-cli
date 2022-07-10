import * as fs from 'fs';
import * as path from 'path';
import fse from 'fs-extra';
import readdirSync from 'recursive-readdir-sync';
import fnIsWindows from 'is-windows';
import md5 from 'md5';
import killPort from 'kill-port';
import syncDirectory from 'sync-directory';
import arrayDiff from 'simple-array-diff';
import inquirer from 'inquirer';

import baseUtil from 'qute-cli-util';

const isWindows = fnIsWindows();
const { networkUtil, pathUtil, npmUtil, scaffoldUtil, logUtil, envUtil } = baseUtil;

let storedParams: { [name: string]: any } = {};

require('child-process-close');

const getPkgObj = (folder) => {
    const pkgJson = path.join(folder, 'package.json');
    const pkgObj = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));

    return pkgObj;
};

const runSyncDirectory = (from, to, { watch, supportSymlink }) => {
    let watcher;

    const commonIgnoreReg = /((\.git)|(\.DS_Store)|(qute-scaffold)|(symlink-qute-scaffold))/i;

    if (isWindows) {
        try {
            fse.removeSync(to);
        } catch (err) {

        }
    }

    // 同步所有文件
    watcher = syncDirectory(from, to, {
        type: isWindows ? 'copy' : 'hardlink',
        watch,
        deleteOrphaned: true,
        supportSymlink,
        exclude: [commonIgnoreReg, pathUtil.cacheFolder.replace(/\/$/, '').split('/').pop() + '/'],
        forceSync: scaffoldUtil.getForceCompileFromConfigFile(),
    });

    return watcher;
};

/**
 * @func
 * @desc run scaffold
 * @param {Object}
 * @param {String} object.currentEnv: current env when running scaffold
 * @param {String} object.cwd: current dir path
 * @param {String} object.workspaceFolder: workspace dir path
 * @param {Number} object.debugPort: used port when running scaffold
 * @param {String} object.scaffoldName: scaffold name ( full name )
 */
const runScaffold = ({ currentEnv, cwd, workspaceFolder, debugPort, scaffoldName, showBuild, scaffoldVersion, symlink, bigMemory }) => {
    const scaffoldFolder = scaffoldUtil.getScaffoldFolder(scaffoldName, scaffoldVersion);
    const cp = require('child_process');

    // 如果脚手架目录没有 node_modules 目录或目录内没有文件，则执行 npm install。这是保险的做法。
    const nodeModulesPath = path.join(scaffoldFolder, 'node_modules');
    if (!fs.existsSync(nodeModulesPath) || fs.readdirSync(nodeModulesPath).length < 1) {
        logUtil.start('为脚手架执行 npm install...');
        try {
            require('child_process').execSync(`cd ${scaffoldFolder} && npm install`, {
                stdio: 'inherit'
            });
            logUtil.stop();
        } catch (err) {
            logUtil.fail('为脚手架执行 npm install 失败');
        }
    }

    let buildFolder = path.join(workspaceFolder, './build');

    // 在 --dev 模式环境或 zebra 环境下，默认使用项目目录作为 build 目录根目录
    if (showBuild) {
        buildFolder = path.join(cwd, './build');
    }

    let child;

    const pkgScripts = (() => {
        let scripts = {};

        const pkgJsonFile = path.join(scaffoldFolder, 'package.json');

        if (fs.existsSync(pkgJsonFile)) {
            scripts = JSON.parse(fs.readFileSync(pkgJsonFile, 'utf8')).scripts;
        }

        return scripts;
    })();

    if (fs.existsSync(path.join(scaffoldFolder, 'qute-entry.js'))) {
        const otherArgs = Array.prototype.slice.call(process.argv, 4);

        const args = [
            `taskName=${currentEnv}`,
            `userDir=${cwd}`,
            `srcDir=${workspaceFolder}`,
            `distDir=${buildFolder}`,
            `port=${debugPort}`,

            `currentEnv=${currentEnv}`,
            `userFolder=${cwd}`,
            `srcFolder=${workspaceFolder}`,
            `buildFolder=${buildFolder}`,
            `debugPort=${debugPort}`,
        ].concat(otherArgs);

        const options = {
            cwd: scaffoldFolder,
            silent: true,
            // stdio: 'inherit'
        };

        if (bigMemory) {
            Object.assign(options, {
                execArgv: ['--max-old-space-size=8192']
            });
            logUtil.logGreen('开启大内存模式: 8GB');
        }

        child = cp.fork('qute-entry.js', args, options);
    } else if (pkgScripts[currentEnv]) {
        // support
        const prefix = [
            `taskName=${currentEnv}`,
            `userDir=${cwd}`,
            `srcDir=${workspaceFolder}`,
            `distDir=${buildFolder}`,
            `port=${debugPort}`,

            `currentEnv=${currentEnv}`,
            `userFolder=${cwd}`,
            `srcFolder=${workspaceFolder}`,
            `buildFolder=${buildFolder}`,
            `debugPort=${debugPort}`,
        ].join(' ');

        child = require('child_process').exec(`${prefix} npm run ${currentEnv}`, {
            // test path
            cwd: scaffoldFolder,
            silent: true,
        });
    } else {
        console.log(`\nScaffold ${scaffoldName.green}'s entry file ${'qute-entry.js'.green} is not found, please check whethor you've inited project with the right scaffold.\n`);
        process.exit(1);
    }

    return child;
};

/**
 * @func
 * @desc record pid and ports used in current pid, for use of killing them next time when running scaffold in the same dir
 * @param {String} main: pid of current process
 * @param {Array} children
 * @param {Number} children[0].pid: pid of child process
 * @param {Array} children[0].ports: ports used by child process
 */
const recordPreProcess = (main, children) => {
    const preProcessRecordFile = path.join(pathUtil.cacheFolder, 'pre-process-record.json');
    const fd = fs.openSync(preProcessRecordFile, 'w+');
    const obj = {};
    obj[md5(process.cwd())] = {
        main,
        children,
    };

    fs.writeFileSync(preProcessRecordFile, JSON.stringify(obj));
    fs.close(fd, () => { });
};

const watchScaffoldProcess = (scaffoldProcess, { syncWatcher, scaffoldFolder, workspaceFolder, debugPort, scaffoldName, onFinished }) => {
    const shouldShowLog = (log) => {
        if (log.indexOf('package in') === -1 && log.indexOf('up to date in') === -1 && log.indexOf('[green]') === -1) {
            return true;
        }

        return false;
    };

    const reduceUselessLog = log => log;

    const exitMaster = (code = 0) => {
        if (syncWatcher) {
            syncWatcher.close();
        }

        (async () => {
            await onFinished();
            process.exit(code);
        })()
    };

    // master exit when child process exit
    scaffoldProcess.on('error', (error) => {
        logUtil.logWhite('exit with error: ', error);
        exitMaster(1);
    });
    scaffoldProcess.on('uncaughtException', (e) => {
        logUtil.logWhite('uncaughtException: ', e);
        exitMaster(1);
    });
    scaffoldProcess.on('SIGINT', () => {
        logUtil.logWhite('exit with sigint');
        exitMaster(1);
    });
    scaffoldProcess.on('unhandledRejection', (reason, p) => {
        // console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
        exitMaster(1);
    });
    scaffoldProcess.on('exit', (code, signal) => {
        if (code == 232 || code == 1000) { // 232 是脚手架 kill-port 后系统返回的 exitCode；1000 是自定义 exitCode
            return;
        }

        // 正常退出情况下，signal 是 null，非 null 的情况全部按照错误处理
        if (signal) {
            console.log('非正常退出，code: ', code, ' signal: ', signal);
            exitMaster(1);
            return;
        }

        exitMaster(code);
    });
    scaffoldProcess.on('message', (message) => {
        if (message === 'restart') {
            startByScaffold();
        }
    });

    // show log of child process
    if (scaffoldProcess.stdout) {
        scaffoldProcess.stdout.setEncoding('utf8');
        scaffoldProcess.stdout.on('data', (data) => {
            if (data) {
                const log = data.toString();
                // 去掉 npm 的无效 log
                if (shouldShowLog(log)) {
                    const newLog = reduceUselessLog(log);
                    process.stdout.write(newLog);
                }
            }
        });
    }
    if (scaffoldProcess.stderr) {
        scaffoldProcess.stderr.on('data', (data) => {
            if (data) {
                const log = data.toString();
                if (shouldShowLog(log)) {
                    const newLog = reduceUselessLog(log);
                    process.stdout.write(newLog);
                }
            }
        });
    }

    const afterKillPort = () => {
        try {
            process.kill(scaffoldProcess.pid);
        } catch (err) {
            // do nothing
        }

        exitMaster();
    };

    process.on('SIGINT', () => {
        killPort(debugPort).then(afterKillPort).catch(afterKillPort);
    });
};

const checkIfShouldSync = async ({ scaffoldFolder, scaffoldName, cwd }) => {
    const scaffoldSyncDeclare = getPkgObj(scaffoldFolder)['qute-sync'];
    const cwdSyncDeclare = getPkgObj(cwd)['qute-sync'];

    let shouldSync = true;

    if ((scaffoldSyncDeclare === false || scaffoldSyncDeclare === 'false') || (cwdSyncDeclare === false || cwdSyncDeclare === 'false')) {
        shouldSync = false;
    }

    return shouldSync;
};

const startByScaffold = async () => {
    const { currentEnv, watch, showBuild, supportSymlink, bigMemory, onFinished } = storedParams;
    const cwd = process.cwd();

    let { scaffoldName, scaffoldVersion } = scaffoldUtil.getScaffoldInfoFromConfigFile();

    if (!scaffoldName) {
        logUtil.fail(`无法获取项目内对脚手架名称的描述，无法启动编译`);
        return;
    }

    scaffoldName = scaffoldUtil.getFullName(scaffoldName);

    // 设置默认脚手架版本
    if (scaffoldVersion === 'default') {
        scaffoldVersion = 'latest';
    }

    const scaffoldFolder = scaffoldUtil.getScaffoldFolder(scaffoldName, scaffoldVersion);

    // ensure latest scaffold
    await scaffoldUtil.ensureScaffoldInstalled(scaffoldName, scaffoldVersion);

    // 是否需要同步副本到脚手架目录，默认为 true
    const shouldSync = await checkIfShouldSync({ scaffoldFolder, scaffoldName, cwd });

    const workspaceFolder = shouldSync ? scaffoldUtil.getWorkspaceFolder({ cwd, scaffoldName, scaffoldVersion }) : cwd;

    const localScaffoldVersion = scaffoldUtil.getScaffoldPkgJsonInfo(scaffoldName, scaffoldVersion).version;

    const debugPort = await networkUtil.getFreePort(9000);

    logUtil.logGreen(`scaffold: ${(scaffoldUtil.getFullName(scaffoldName) + '@' + (scaffoldVersion === 'latest' ? 'latest:' + localScaffoldVersion : localScaffoldVersion)).green}; task: ${currentEnv.green}`);

    const compilerStartTime = Date.now();
    logUtil.start('正在启动编译器...');

    if (!fs.existsSync(path.join(cwd, 'node_modules'))) {
        console.log('');
        logUtil.logGreen('npm installing');
        npmUtil.runNpmInstall({ showLog: true });
        logUtil.logGreen('npm installed');
    }

    let watcher = null;

    if (shouldSync) {
        watcher = runSyncDirectory(cwd, workspaceFolder, { watch, supportSymlink });
    }

    // run scaffold
    const scaffoldProcess = runScaffold({
        currentEnv,
        cwd,
        workspaceFolder,
        scaffoldName,
        debugPort,
        showBuild,
        scaffoldVersion,
        symlink: supportSymlink,
        bigMemory,
    });

    if (scaffoldProcess) {
        watchScaffoldProcess(scaffoldProcess, { syncWatcher: watcher, scaffoldFolder, workspaceFolder, debugPort, scaffoldName, onFinished });

        recordPreProcess(process.pid, [{
            pid: scaffoldProcess.pid,
            ports: [debugPort],
        }]);
    }

    logUtil.succeed(`编译器启动完成，耗时：${(Date.now() - compilerStartTime) / 1000}s`);
    logUtil.stop();
};

export default class Action {
    constructor() {};

    public async run(currentEnv, { watch = false, showBuild = false, supportSymlink = false, bigMemory = false, onFinished = () => { } }) {
        storedParams = {
            currentEnv,
            watch,
            showBuild,
            supportSymlink,
            bigMemory,
            onFinished,
        };

        startByScaffold();
    }
}