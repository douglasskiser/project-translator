export type NestedObject = {
    [key:string]: string | object | undefined
}

async function translateText(text: string, target: string, translate: (text: string, target: string) => Promise<string[]>) {
    try {
        const results = await translate(text, target);
        return results[0];
    } catch (err) {
        throw new Error(err);
    }
}

function getValue(source: NestedObject, path: string | string[]): string | object | undefined {
    const _path = typeof path === 'string' ? path.split('.') : path;
    const [head, ...rest] = _path;
        if (source[head]) {
            return rest.length
            ? getValue(source[head] as NestedObject, rest)
            : source && source[head] as object | string;
        }
        return undefined;
}

function setValue(source: NestedObject, path: string | string[], value: string | object | undefined): NestedObject {
    const [head, ...rest] = typeof path === 'string' ? path.split('.') : path;
    return {
        ...source,
        [head]: rest.length
            ? setValue(source[head] as NestedObject|| {}, rest, value)
            : value
    };
}

async function generateDiffWithCount(source: NestedObject, target: NestedObject, transformer?: (v: string) => Promise<string>) : Promise<[NestedObject, number]> {
    let diff: NestedObject = {};
    let count = 0;
    async function getDiff(cb: (v: NestedObject) => void, path?: string[], prefix: string[] = [], value?: object | undefined) {
        const entries = !path ? Object.entries(source) : Object.entries(value as object);
        await Promise.all(entries.map(async entry => {
            const [key, entryValue] = entry;
            const [firstPathKey, ...restOfPathKeys] = path || [];
            if (typeof entryValue === 'object') {
                return getDiff(cb, !path ? [firstPathKey || key] : restOfPathKeys, [...prefix, key], entryValue)
            }
            const targetPath = !path ? [key] : [...prefix, key];
            if (!getValue(target, targetPath)) {
                const value = transformer ? await transformer(entryValue): entryValue;
                return cb(setValue(diff, targetPath, value));
            }
        }))
    }
    await getDiff((value) => {
        count++;
        diff = {...diff, ...value};
    });
    return [diff, count];
}

export {
    generateDiffWithCount, translateText
}