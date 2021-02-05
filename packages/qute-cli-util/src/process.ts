class ErrorUtil {
    constructor() {
        
    }

    public onExit(onExit = (code) => { }) {
        process.on('exit', (code) => {
            onExit(code);
        });
    }

    public onError(onError = (reason?: any) => { }) {
        process.on('uncaughtException', (reason) => {
            // console.error(reason);
            onError(reason);
            process.exit(1);
        });

        process.on('SIGINT', () => {
            onError();
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, p) => {
            // console.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
            onError(reason);
            process.exit(1);
        });
    }
}

export default new ErrorUtil();