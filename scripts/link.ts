import * as fs from 'fs'
import * as path from 'path'
import * as childProcess from 'child_process'

const config = {
    'qute-cli': ['qute-cli-util'],
    'qute-cli-core': ['qute-cli-util'],
}

const lernaPath = path.join(__dirname, '../node_modules/.bin/lerna')

Object.keys(config).forEach(key => {
    const valArr = config[key]

    // lerna add qute-cli-core --scope=qute-cli-util
    valArr.forEach(dep => {
        try {
            console.log(`${lernaPath} add ${dep} --scope=${key}`);
            childProcess.execSync(`${lernaPath} add ${dep} --scope=${key}`, { stdio: 'inherit' })
        } catch(err) {
            console.log('error when: ', `${lernaPath} add ${dep} --scope=${key}`)
        }
    })
})
