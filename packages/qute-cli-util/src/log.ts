import ora from 'ora';

let globalSpinner = ora();

class Log {
    constructor() {};

    start(content) {
        return globalSpinner.start(`${'[qute-cli]'.green} ${content}`);
    };
    succeed(content) {
        return globalSpinner.succeed(`${'[qute-cli]'.green} ${content}`);
    };
    warn(content) {
        return globalSpinner.succeed(`${'[qute-cli]'.yellow} ${content}`);
    };
    fail(content) {
        return globalSpinner.fail(`${'[qute-cli]'.red} ${content}`);
    };
    stop() {
        return globalSpinner.stop();
    };
    clear() {
        return globalSpinner.clear();
    };
    logWhite(...args) {
        console.log('[qute-cli]', ...args);
    };
    logGreen(...args) {
        console.log('[qute-cli]'.green, ...args);
    };
    logYellow(...args) {
        console.log('[qute-cli]'.yellow, ...args);
    };
    logRed(...args) {
        console.log('[qute-cli]'.red, ...args);
    };
    getGlobalSpinner() {
        return globalSpinner;
    };
}

export default new Log();