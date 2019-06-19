const cliProgress = require('cli-progress');
const colors = require('colors/safe');
const {logMessage} = require('./logging.utils');

function onLog(log) {
    console.log(log); // eslint-disable-line
}

function onError() {
    process.exit(1);
}

function generateProgressBar() {
    return new cliProgress.Bar({}, {
        format: colors.cyan(' {bar}') + ' {percentage}% | ETA: {eta}s | {value}/{total}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591'
    });
}

function generateLog({
    type,
    message
}) {
    logMessage({
        message,
        type,
        onLog,
        onError
    });
}

const commonUtils = {
    onLog,
    onError,
    generateProgressBar,
    generateLog
};

module.exports = commonUtils;