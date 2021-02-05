/**
 * @file
 * @desc local mock
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

import * as fs from 'fs';
import * as path from 'path';
import fse from 'fs-extra';
import nodestatic from 'node-static';
import * as modHttp from 'http';
import * as modHttps from 'https';
import request from 'request';
import baseUtil from 'qute-cli-util';

const { networkUtil, logUtil } = baseUtil;

let config = {
    proxy: false,
    host: 'localhost'
}

function createDemo(mockDir) {
    const demoPath = path.join(mockDir, 'test.json');

    if (fs.existsSync(demoPath)) {
        return;
    }
    fse.ensureFileSync(demoPath);

    const fd = fs.openSync(demoPath, 'w+');
    fs.writeFileSync(demoPath, JSON.stringify({
        name: 'mock',
        value: 'Hi',
    }));
    fs.closeSync(fd);
}

function createResultFile(mockDir, { name, content }) {
    const filePath = path.join(mockDir, `${name}.json`);
    fse.ensureFileSync(filePath);
    const fd = fs.openSync(filePath, 'w+');
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    fs.closeSync(fd);
}

function requestData(options, callback) {
    let { url, headers } = options
    const { host } = config
    url = `http://${host}${options.url}`
    headers.host = host
    headers['accept-encoding'] = ''
    request({
        url,
        headers,
    }, (err, response, body) => {
        if (!err && response.statusCode == 200) {
            callback(body);
        }
    });
}

export default class Action {
    constructor() {

    };

    public async run(port = 7000, { force = false, domain = 'localost', https = false } = {}) {
        const cwd = process.cwd();
        const mockDir = path.join(cwd, 'mock');

        const configPath = path.join(cwd, '.mockrc')
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        }

        if (!fs.existsSync(mockDir) && force) {
            createDemo(mockDir);
        }

        if (fs.existsSync(mockDir)) {
            // check port used info
            const portInUse = await networkUtil.checkPortUsed(port);

            if (portInUse) {
                logUtil.logYellow(`${'[mock]'.yellow} 端口 ${(port + '').green} 被占用，mock 启动失败, 可以尝试 "${'qute mock 7001'.green}" 启动 mock 服务.`);
                return;
            }

            const mockfile = new nodestatic.Server(mockDir, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
            });

            const callback = (request, response) => {
                const { pathname } = require('url').parse(request.url)
                const requestFilePath = `${path.join(cwd, 'mock', pathname)}.json`

                if (!fs.existsSync(requestFilePath) && config.proxy) {
                    // 不存在mock文件 请求对应接口返回结果
                    requestData(request, (body) => {
                        response.writeHead(200, {
                            'Content-Type': 'text/plain',
                            'Access-Control-Allow-Origin': request.headers.origin || '*',
                            'Access-Control-Allow-Credentials': true,
                            'content-type': 'application/json;charset=UTF-8',
                        });
                        response.end(body);
                    })
                } else {
                    request.url = pathname;

                    let data = '{ error: no mock file }';
                    if (!/\.json$/.test(request.url)) {
                        const jsonFile = `${path.join(cwd, 'mock', request.url)}.json`;
                        const nojsonFile = `${path.join(cwd, 'mock', request.url)}`;

                        if (!fs.existsSync(nojsonFile) && fs.existsSync(jsonFile)) {
                            // data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
                            request.url = `${request.url}.json`;
                        }
                    } else {
                        const jsonFile = `${path.join(cwd, 'mock', request.url)}`;
                        if (fs.existsSync(jsonFile)) {
                            data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
                        }
                    }

                    // createResultFile(mockDir, {
                    //     name: `${request.url}-result`,
                    //     content: Mock.mock(data)
                    // });
                    // request.url = `${request.url}-result.json`;

                    request.addListener('end', () => {
                        mockfile.options.headers['Access-Control-Allow-Origin'] = request.headers.origin || '*';
                        mockfile.options.headers['Content-Type'] = 'application/json';
                        mockfile.serve(request, response);
                    }).resume();
                }
            };

            if (https) {
                const ssl = await require('devcert').certificateFor(domain, { getCaPath: true });
                const { key, cert } = ssl;
                modHttps.createServer({ key, cert }, callback).listen(port);
            } else {
                modHttp.createServer(callback).listen(port);
            }

            logUtil.logGreen(`${'[mock]'.green} 本地 mock 服务已启动，监听端口 ${7000} `);
            logUtil.logGreen(`${'[mock]'.green} demo: http${https ? 's' : ''}://127.0.0.1:${port}/test.json`);
        }
    }
}
