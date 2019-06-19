const test = require('tape');
const processUtils = require('./process.utils');

test('getDeltaCount', t => {
    const output = processUtils.getDeltaCount({
        inputData: {
            a: {
                b: {
                    b: 'b'
                }
            },
            c: 'c',
            d: {
                e: 'e'
            }
        },
        outputData: {
            a: {},
            c: 'c',
            d: {}
        }
    });
    t.equal(output.count, 2, 'returns expected count');
    t.deepEqual(output.delta, {
        a: {
            b: {
                b: 'b'
            }
        },
        d: {
            e: 'e'
        }
    }, 'returns expected object with delta properties');
    t.end();
});

test('processTranslationObject', async t => {
    let progressBarSpy = 0;
    const output1 = await processUtils.processTranslationObject({
        inputData: {
            test: 'test',
            test2: {
                test3: [{
                    test4: 'test'
                }]
            }
        },
        outputData: {
            test: 'test'
        },
        targetLanguage: 'en',
        progressBar: {
            increment: () => (progressBarSpy++)
        },
        translate: {
            translate: () => Promise.resolve(['test'])
        }
    });
    t.equal(progressBarSpy, 2, 'progress bar was incremented the right amount of times')
    t.deepEqual(output1, {
        test: 'test',
        test2: {
            test3: [{
                test4: 'test'
            }]
        }
    }, 'returns expected output');
    t.end();
});