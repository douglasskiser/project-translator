const test = require('tape');
const rewire = require('rewire');
const fileUtils = rewire('./file.utils');

test('doesFileExist', async t => {
    fileUtils.__set__('fs', {
        access: (ignore, error, cb) => {
            cb();
        }
    });
    let output = await fileUtils.doesFileExist('./test');
    t.equal(output, true, 'it will look for  a file');
    t.end();
});

test('writeFile', async t => {
    fileUtils.__set__('fs', {
        writeFile: (ignore, error, cb) => {
            cb();
        }
    });
    let output = await fileUtils.writeFile({
        filePath: './test',
        content: 'test'
    });
    
    t.ok(output ===  undefined, 'it will write a file');
    t.end();
});

test('readFile', async t => {
    fileUtils.__set__('fs', {
        readFile: (ignore, cb) => {
            cb(null, JSON.stringify({"test": "test"}));
        }
    });
    let output = await fileUtils.readFile({
        filePath: './test'
    });

    t.ok(output, 'it will read a file');
    t.end();
});