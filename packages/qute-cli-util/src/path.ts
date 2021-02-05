import * as path from 'path';
const cacheName = '.qute';

class Path {
    constructor() {
        this.cacheFolder = this.getCache();
        this.cmdCacheFolder = path.join(this.cacheFolder, 'qute-cmd-cache');
        this.statusFilePath = path.join(this.cacheFolder, 'qute-cli-core-status');
        this.pluginCacheFolder = path.join(this.cacheFolder, 'plugins');
    };

    public cacheFolder = '';
    public cmdCacheFolder = '';
    public pluginCacheFolder = '';
    public statusFilePath = '';

    public getCache() {
        let cache = path.join(process.env.HOME, cacheName);
        return cache;
    };
}

export default new Path();