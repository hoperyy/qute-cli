import * as fs from 'fs';
import * as path from 'path';

const pkglockPath = path.join(__dirname, '../package-lock.json');

const content = fs.readFileSync(pkglockPath, 'utf-8');

if (content.indexOf('http://github.com') !== -1) {
    throw Error('有非 https 的链接!');
}