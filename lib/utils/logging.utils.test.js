const test = require('tape');
const loggingUtils = require('./logging.utils');

const generateErrorColorLog = ({prefix, message}) => `\x1b[31m${prefix}\x1b[39m${message}`;
const generateInfoColorLog = ({prefix, message}) => `\x1b[36m${prefix}\x1b[39m${message}`;
const generateSuccessColorLog = ({prefix, message}) => `\x1b[32m${prefix}\x1b[39m${message}`;

test('STATUS', t => {
    t.deepEqual(loggingUtils.STATUS.ERROR, 'error', 'ERROR constant is using correct value');
    t.deepEqual(loggingUtils.STATUS.INFO, 'info', 'INGO constant is using correct value');
    t.deepEqual(loggingUtils.STATUS.SUCCESS, 'success', 'SUCCESS constant is using correct value');
    t.end();
});

test('logMessage:error', t => {
    let onErrorSpy = false;
    let onLogSpy = null;
    loggingUtils.logMessage({
        message: 'error:test',
        type: loggingUtils.STATUS.ERROR,
        onError: () => (onErrorSpy = true),
        onLog: log => (onLogSpy = log)
    });
    t.equal(onErrorSpy, true, 'onErrorSpy event was called on logging of error message');
    t.equal(onLogSpy, generateErrorColorLog({prefix: 'error: ', message: 'error:test'}), 'onLogSpy event was called with error message');
    t.end();
});

test('logMessage:info', t => {
    let onErrorSpy = false;
    let onLogSpy = null;
    loggingUtils.logMessage({
        message: 'info:test',
        type: loggingUtils.STATUS.INFO,
        onError: () => (onErrorSpy = true),
        onLog: log => (onLogSpy = log)
    });
    t.equal(onErrorSpy, false, 'onErrorSpy event was not called');
    t.equal(onLogSpy, generateInfoColorLog({prefix: 'info: ', message: 'info:test'}), 'onLogSpy event was called with info message');
    t.end();
});

test('logMessage:success', t => {
    let onErrorSpy = false;
    let onLogSpy = null;
    loggingUtils.logMessage({
        message: 'success:test',
        type: loggingUtils.STATUS.SUCCESS,
        onError: () => (onErrorSpy = true),
        onLog: log => (onLogSpy = log)
    });
    t.equal(onErrorSpy, false, 'onErrorSpy event was not called');
    t.equal(onLogSpy, generateSuccessColorLog({prefix:'success: ', message: 'success:test'}), 'onLogSpy event was called with success message');
    t.end();
});