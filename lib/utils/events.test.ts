import {describe, it, mock} from 'node:test';
import assert from 'node:assert';
import {onError, onExit} from './event';

describe('events utils', () => {
    describe('onError', () => {
        it('should call process.exit with status code 1', () => {
            const processMock = mock.method(process, 'exit', (code: number) => code);
            onError();
            assert.strictEqual(processMock.mock.callCount(), 1, 'process.exit was called');
            assert.strictEqual(processMock.mock.calls[0].arguments[0], 1, 'status code was passed to process.exit');
        });
    });
    describe('onExit', () => {
        it('should call process.exit with status code 1', () => {
            const processMock = mock.method(process, 'exit', (code: number) => code);
            onExit(1);
            assert.strictEqual(processMock.mock.callCount(), 1, 'process.exit was called');
            assert.strictEqual(processMock.mock.calls[0].arguments[0], 1, 'status code was passed to process.exit');
        });
    })
});