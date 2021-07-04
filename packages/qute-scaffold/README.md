![Mac Available](https://img.shields.io/badge/Mac-available-brightgreen.svg) ![Windows Unavailable](https://img.shields.io/badge/Windows-unavailable-red.svg) [![Node version](https://img.shields.io/badge/node-%3E%3D%208.9.1-brightgreen.svg)](http://nodejs.org/) [![Npm Version](https://img.shields.io/badge/npm-%3E%3D%205.5.1-brightgreen.svg)](https://www.npmjs.com/)


## This is a qute scaffold.

[What is qute?](https://github.com/weidian-inc/qute-cli)

`qute-entry.js` is the file that qute runs scaffold.

`project-template/` is demo dir.

Supported tasks:

+   `dev-daily`: develop in daily environment
+   `dev-pre`: develop in pre environment
+   `dev-prod`: develop in prod environment
+   `build-daily`: build in daily environment
+   `build-pre`: build in pre environment
+   `build-prod`: build in prod environment

Quick Start:

+   step1: install Node.js（8.9.1+）

    https://nodejs.org/en/download/

+   step2: install qute

    `npm install qute-cli -g`

+   step 3

    `mkdir demo`

    `cd demo`
    
+   step 4

    `qute init qute-scaffold`

+   step 5

    ```
    npm install
    ```
    
+   step 6
    
    ```
    qute run dev-daily
    ```

## project tree

```
pages/
    index/
        index.html
        index.js
        index.less
    detail/
        index.html
        index.js
        index.less
```

## build output

```
dist/
    pages/
        index.html
        detail.html
    static/
        index/index.js
        detail/index.js
```