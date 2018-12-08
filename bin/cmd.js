#!/usr/bin/env node

/**
 * @file
 * @desc qute client by order "q" / "qute"
 * @author liuyuanyangscript@gmail.com
 * @date  2018/12/09
 */

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const commander = require('commander');

const cacheFolder = path.join(process.env.HOME, '.qute');

const packageName = 'qute-core';
const targetFolder = path.join(cacheFolder, 'qute-commands');

require('hot-update-package')({
    packageName,
    cacheFolder: path.join(cacheFolder, 'qute-cli-core-update-package-cache'),
    targetFolder: targetFolder,
    callback() {
        require(`${path.join(targetFolder, 'node_modules', packageName)}/bin/cmd`)(commander);
    }
});
