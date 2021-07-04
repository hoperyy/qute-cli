import processUtil from './src/process';
import fileUtil from './src/file';
import logUtil from './src/log';
import networkUtil from './src/network';
import pathUtil from './src/path';
import scaffoldUtil from './src/scaffold';
import npmUtil from './src/npm';
import envUtil from './src/env';

class BaseUtil {
    constructor() {};

    public processUtil = processUtil;

    public fileUtil = fileUtil;

    public logUtil = logUtil;

    public networkUtil = networkUtil;

    public pathUtil = pathUtil;

    public scaffoldUtil = scaffoldUtil;

    public npmUtil = npmUtil;

    public envUtil = envUtil;
};

export default new BaseUtil()

export { BaseUtil }
