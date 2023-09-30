import {describe, it, mock} from 'node:test';
import assert from 'node:assert';
import {
    doesFileExist,
    readFile,
    writeFile
} from './file';
import fs from 'node:fs';

describe('file utils', () => {
    describe('doesFileExist', () => {
        it('should call access method to check if file exists', async () => {
            const accessMock = mock.method(fs, 'access', (_path: string, _mode: string, cb: (err: boolean) => void) => cb(false));
            const _doesFileExist = await doesFileExist('test.ts');
            assert.strictEqual(accessMock.mock.callCount(), 1, 'access was called');
            assert.strictEqual(_doesFileExist, true, 'file exist was returned');
        });
        it('should call access method to check if file exists', async () => {
            const accessMock = mock.method(fs, 'access', (_path: string, _mode: string, cb: (err: boolean) => void) => cb(true));
            const _doesFileExist = await doesFileExist('test.ts');
            assert.strictEqual(accessMock.mock.callCount(), 1, 'access was called');
            assert.strictEqual(_doesFileExist, false, 'file does not exist was returned');
        });
    });
    describe('readFile', () => {
        it('should call read file method', async () => {
            const readFileMock = mock.method(fs, 'readFile', (_path: string, cb: () => void) => cb());
            await readFile('test.ts');
            assert.strictEqual(readFileMock.mock.callCount(), 1, 'read file was called');
        });
        it('should reject promise if error occurs while reading file', async () => {
            mock.method(fs, 'readFile', (_path: string, cb: (err: boolean) => void) => cb(true));
            await assert.rejects(() => readFile('test.ts'), 'promise was rejected while reading file');
        });
    });
    describe('writeFile', () => {
        it('should call write file method', async () => {
            const writeFileMock = mock.method(fs, 'writeFile', (_path: string, _content: string, cb: () => void) => cb());
            await writeFile('test.ts', 'test');
            assert.strictEqual(writeFileMock.mock.callCount(), 1, 'write file was called');
        });
        it('should reject promise if error occurs while reading file', async () => {
            mock.method(fs, 'writeFile', (_path: string, _content: string,  cb: (err: boolean) => void) => cb(true));
            await assert.rejects(() => writeFile('test.ts', 'test'), 'promise was rejected while reading file');
        });
    });
});