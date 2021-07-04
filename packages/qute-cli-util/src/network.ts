import getPort from 'get-port';

class Network {
    constructor() {

    };

    private portCheckCount = 0;

    /**
     * @thunk function
     * @private
     * @desc get free port
     * @param {Number/String} defaultPort
     */
    private _getPort(defaultPort): Promise<number> {
        return new Promise(resolve => {
            getPort(defaultPort).then((port) => {
                resolve(port);
            });
        });
    };

    /**
     * @func
     * @desc check whether port was used
     * @param {Number/String} port
     */
    public async checkPortUsed(port) {
        const newPort: number = await this._getPort(port);

        if (parseInt(newPort + '', 10) === parseInt(port, 10)) {
            return false;
        }

        return true;
    };

    /**
     * @func
     * @desc get free port. It will increase one by one from defaultPort to get free port
     * @param {Number/String} defaultPort
     */
    public async getFreePort(defaultPort): Promise<number> {
        const finalPort = await this._getPort(defaultPort);

        this.portCheckCount++;

        if (this.portCheckCount <= 10 && finalPort !== defaultPort) {
            return await this.getFreePort(defaultPort + 1);
        }

        return defaultPort;
    };
}

export default new Network();