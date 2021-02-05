import * as path from 'path';
import * as fs from 'fs';
import fse from 'fs-extra';
import readdirEnhanced from 'readdir-enhanced';

import pathUtil from './path';

const readdirEnhancedSync = require('readdir-enhanced').sync;

class File {
    constructor() {

    };

    /**
     * @func
     * @desc read dir files
     * @param {String} dir: dir path
     * @param {String/RegExp} filter: situations of filtering files
     */
    public readdirSync(dir, filter) {
        return readdirEnhancedSync(dir, {
            deep: filter || true,
            basePath: dir,
        });
    };

    /**
     * @func
     * @desc utime file
     * @param {String} filePath
     */
    public utime(filePath) {
        const newTime = ((Date.now() - (10 * 1000))) / 1000;
        fs.utimesSync(filePath, newTime, newTime);
    };

    /**
     * @func
     * @desc copy file or dir and utime them
     * @param {String} from: src dir/file path
     * @param {String} to: target dir/file path
     */
    public copySync(from, to) {
        fse.copySync(from, to);
        this.utime(to);
    };

    /**
     * @func
     * @desc write file
     * @param {String} filePath: file path
     * @param {String} content: file content for writing
     */
    public writeFileSync(filePath, content) {
        fse.ensureFileSync(filePath);
        const fd = fs.openSync(filePath, 'w+');
        fs.writeFileSync(filePath, content);
        fs.close(fd, () => {});
    };

    public isEmptyDir({ dir = '', ignored = [ /readme\.md/i ] } = {}) {
        const defaultIgnored = /(\.git)|(\.idea)|(\.ds_store)|(readme\.md)|(\.npmignore)/i;

        let isEmpty = true;

        fs.readdirSync(dir).forEach((filename) => {
            if (defaultIgnored.test(filename)) {
                return;
            }

            if (ignored) {
                const type = Object.prototype.toString.call(ignored);
                if (type === '[object RegExp]') {
                    if ((ignored as unknown as RegExp).test(filename)) {
                        return;
                    }
                } else if (type === '[object String]') {
                    if ((ignored as unknown as String) === filename) {
                        return;
                    }
                } else if (type === '[object Array]') {
                    for (let i = 0; i < ignored.length; i += 1) {
                        const itemType = Object.prototype.toString.call(ignored[i]);

                        if (itemType === '[object RegExp]') {
                            if (ignored[i].test(filename)) {
                                return;
                            }
                        } else if (itemType === '[object String]') {
                            if ((ignored as unknown as Array<any>)[i] === filename) {
                                return;
                            }
                        }
                    }
                }
            }

            isEmpty = false;
        });

        return isEmpty;
    };

    /**
     * @func
     * @desc rename some files
     * @param {String} dir: current project dir path
     */
    public renameInvisableFiles(dir) {
        // rename files like gitignore/npmrc/npmignor to .gitignore/.npmrc/.npmignor
        const arr = fs.readdirSync(dir);
        arr.forEach((filename) => {
            if (/^((gitignore)|(npmrc)|(npmignore))$/.test(filename)) {
                const src = path.join(dir, filename);
                const target = path.join(dir, `.${filename}`);

                if (!fs.existsSync(target)) {
                    try {
                        fse.moveSync(src, target);
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
        });
    };
}

export default new File();