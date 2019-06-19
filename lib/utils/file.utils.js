const fs = require('fs');
const {STATUS} = require('./logging.utils');
const {generateLog} = require('./common.utils');

function doesFileExist(path) {
    return new Promise((resolve) => {
        fs.access(path, fs.F_OK, (err) => {
            if (err) {
                resolve(false);
            }
            resolve(true);
        });
    });
}

function readFile({filePath}) {
    return new Promise((resolve) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                generateLog({
                    message: err,
                    type: STATUS.ERROR
                });
            }
            resolve(!!data ? JSON.parse(data) : null);
        });
    });
}

function writeFile({
    filePath,
    content
}) {
    return new Promise((resolve) => {
        fs.writeFile(filePath, content, err => {
            if (err) {
                generateLog({
                    message: err,
                    type: STATUS.ERROR
                });
            }
            resolve();
        });
    });
}

const fileUtils = {
    doesFileExist,
    writeFile,
    readFile
};

module.exports = fileUtils;