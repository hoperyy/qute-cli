#!/usr/bin/env node
/**
 * @file
 * @desc bio client
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

import Util from './util';

(async () => {
    const util = new Util();

    util.processUtil.onError((err) => {
        if (err) {
            console.log(err);
        }
        util.setInstallStatus('resolved');
    });

    util.processUtil.onExit((code) => {
        util.setInstallStatus('resolved');
        process.exit(code);
    });
    
    await util.detectFile();
    await util.run();
})();
