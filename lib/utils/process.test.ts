import {describe, it} from 'node:test';
import assert from 'node:assert';
import {generateDiffWithCount, translateText} from './process';
import {stub} from 'sinon';

describe('process utils', () => {
    describe('generateDiffWithCount', () => {
        it('should return diff between two translation files', async () => {
            const output = await generateDiffWithCount({
                test: 'test',
                'test.test': {
                    test: 'test',
                    'test.test': 'test',
                    'same.same': 'same',
                    deep: {
                        'deep.deepest': 'deep',
                        same: 'same'
                    }
                }
            }, {
                'test.test': {
                    'same.same': 'same',
                    deep: {
                        same: 'same'
                    }
                }
            });
            assert.deepEqual(output[0], {
                test: 'test',
                'test.test': {
                    test: 'test',
                    'test.test': 'test',
                    deep: {
                        'deep.deepest': 'deep'
                    }
                }
            });
            assert.strictEqual(output[1], 4);
        });
    });

    describe('translateText', () => {
        it('should return translated text', async () => {
            const text = 'test';
            const translate = stub().resolves(['test:translated']);
            const output = await translateText(text, 'en-US', translate);
            assert.strictEqual(output, 'test:translated');
            assert.strictEqual(translate.calledWith(text, 'en-US'), true);
        });
        it('should catch and throw error if translate throws', async () => {
            const text = 'test';
            const translate = stub().throws();
            await assert.rejects(async () => {
                await translateText(text, 'en-US', translate)
            }, (err: Error) => {
                assert.strictEqual(err.message, 'Error: Error');
                return true;
            });
        });
    });
});