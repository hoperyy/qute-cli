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

const packageName = 'qute-cli-core';
const targetFolder = path.join(cacheFolder, 'qute-commands');

require('../../qute-cli-core/bin/cmd')(commander);
