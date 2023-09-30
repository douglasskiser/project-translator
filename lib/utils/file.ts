import {access, constants, writeFile as nodeWriteFile, readFile as nodeReadFile} from 'fs';

function doesFileExist(path: string) {
    return new Promise((resolve) => {
        access(path, constants.F_OK, (err) => resolve(!err));
    });
}

async function readFile(path: string) {
    return new Promise((resolve, reject) => {
        nodeReadFile(path, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(!!data ? JSON.parse(data as unknown as string) : null);
        });
    });
}

function writeFile(path: string, content: string) {
    return new Promise((resolve, reject) => {
        nodeWriteFile(path, content, err => {
            if (err) {
                reject(err);
            }
            resolve(null);
        });
    });
}

export {
    doesFileExist,
    readFile,
    writeFile
}