function createLog(message: string) {
    console.log(message);
}

function createErrorLog(err: Error | string) {
    if (typeof err === 'string') {
        console.error(err);
    } else {
        console.error(err.stack);
    }
}

export {
    createLog,
    createErrorLog
}