import {describe, it} from 'node:test';
import assert from 'node:assert';
import {generateDiffWithCount} from './process';

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
});