const colors = require('colors/safe');
const noop = require('lodash/noop');

const STATUS = {
    ERROR: 'error',
    INFO: 'info',
    SUCCESS: 'success'
};

function logMessage({
    message,
    type,
    onError = noop,
    onLog = noop
}) {
    const statusConfig = {
        [STATUS.ERROR]: {
            color: 'red',
            prefix: 'error: '
        },
        [STATUS.INFO]: {
            color: 'cyan',
            prefix: 'info: '
        },
        [STATUS.SUCCESS]: {
            color: 'green',
            prefix: 'success: '
        }
    }[type];
    onLog(colors[statusConfig.color](statusConfig.prefix) + message);
    if (type === STATUS.ERROR) {
        onError();
    }
}

const loggingUtils = {
    STATUS,
    logMessage
};

module.exports = loggingUtils;