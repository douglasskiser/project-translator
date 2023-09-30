import { Command } from 'commander';

function onError() {
    process.exit(1);
}

function onExit(code: number, program?: Command) {
    if (!program) {
        process.exit(code);
    } else {
        program.error('', {exitCode: code});
    }
}

export {
    onError, onExit
}