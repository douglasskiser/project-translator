import {describe, it, mock} from 'node:test';
import assert from 'node:assert';
import {createLog, createErrorLog} from './log';

describe('log utils', () => {
    describe('createLog', () => {
        it('should call console.log', () => {
            const logMock = mock.method(console, 'log', (message: string) => message);
            createLog('test');
            assert.strictEqual(logMock.mock.callCount(), 1, 'console.log was called');
            assert.strictEqual(logMock.mock.calls[0].arguments[0], 'test', 'message was passed to console.log');
        });
    });
    describe('createErrorLog', () => {
        it('should call console.error', () => {
            const logMock = mock.method(console, 'error', (message: string) => message);
            createErrorLog('test');
            assert.strictEqual(logMock.mock.callCount(), 1, 'console.error was called');
            assert.strictEqual(logMock.mock.calls[0].arguments[0], 'test', 'message was passed to console.error');
        });
    })
});