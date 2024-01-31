import {parse, MessageFormatElement, TYPE} from '@formatjs/icu-messageformat-parser';

export type NestedObject = {
    [key:string]: string | object | undefined
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

function getParsedIcuLabelWithSlugs(label: string) : [string, MessageFormatElement[]] {
    const ast = parse(label);
    const slugs: MessageFormatElement[] = [];
    let parsedLabel = '';
    ast.forEach(formatElem => {
        if (formatElem.type === TYPE.literal) {
            parsedLabel += formatElem.value;
        } else {
            slugs.push(formatElem);
            parsedLabel += '#';
        }
    })
    return [parsedLabel, slugs];
}


function parseSlug(slug: MessageFormatElement): string {
    function parseSlugOptions(slugOptions: MessageFormatElement[]) {
        return slugOptions.map(option => {
            return parseSlug(option);
        }).join('');
    }
    if (slug.type === TYPE.argument) {
        return `{${slug.value}}`;
    }
    if (slug.type === TYPE.date) {
        return `{${slug.value}, date${slug.style ? `, ${slug.style}` : ''}}`
    }
    if (slug.type === TYPE.number) {
        return `{${slug.value}, number${slug.style ? `, ${slug.style}` : ''}}`
    }
    if (slug.type === TYPE.time) {
        return `{${slug.value}, time${slug.style ? `, ${slug.style}` : ''}}`
    }
    if (slug.type === TYPE.tag) {
        return `<${slug.value}>${slug.children.reduce((reduction, childElem) => reduction + parseSlug(childElem), '')}</${slug.value}>`
    }
    if (slug.type === TYPE.plural) {
        return `{${slug.value}, plural, ${Object.entries(slug.options).reduce((reduction: string, option: [string, {value: MessageFormatElement[]}]) => reduction += ` ${option[0]} {${parseSlugOptions(option[1].value)}}`, '')}}`
    }
    if (slug.type === TYPE.select) {
        return `{${slug.value}, select, ${Object.entries(slug.options).reduce((reduction: string, option: [string, {value: MessageFormatElement[]}]) => reduction += ` ${option[0]} {${parseSlugOptions(option[1].value)}}`, '')}}`
    }
    if (slug.type === TYPE.pound) {
        return '#';
    }
    return slug.value
}

function replaceSlugsInIcuLabel(label: string, slugs: MessageFormatElement[]): string {
    const _slugs = [...slugs];
    let unsluggedLabel = '';
    let index = 0;
    for (index; index < label.length; index++) {
        const char = label[index];
        if (char !== '#') {
            unsluggedLabel += char;
            continue;
        }
        unsluggedLabel += parseSlug(_slugs.shift() as MessageFormatElement)
    }
    return unsluggedLabel;
}

async function transformSlugs(slugs: MessageFormatElement[], transformer?: (v: string) => Promise<string>): Promise<MessageFormatElement[]> {
    const transformedSlugs: MessageFormatElement[] = [];
    for (let index = 0; index < slugs.length; index++) {
        const slug = slugs[index];
        if ((slug.type === TYPE.select || slug.type === TYPE.plural) && slug.options) {
            const optionEntries = Object.entries(slug.options);
            for (let optionIndex = 0; optionIndex < optionEntries.length; optionIndex++) {
                if (optionEntries[optionIndex][1].value.length) {
                    optionEntries[optionIndex][1].value = await transformSlugs(optionEntries[optionIndex][1].value, transformer);
                    optionEntries.forEach(([key, value]) => {
                        slug.options[key] = value;
                    })
                }
            }
        }
        if (slug.type === TYPE.tag && slug.children.length) {
            slug.children = await transformSlugs(slug.children, transformer);
        }
        if (slug.type === TYPE.literal && transformer) {
            slug.value = await transformer(slug.value);
        }
        transformedSlugs.push(slug);
    }
    return transformedSlugs;
}

async function translateIcuLabel(icuLabel: string, transformer?: (v: string) => Promise<string>): Promise<string> {
    const [label, slugs] = getParsedIcuLabelWithSlugs(icuLabel);
    const value = transformer ? await transformer(label): label;
    const transformedSlugs = await transformSlugs(slugs, transformer);
    
    return replaceSlugsInIcuLabel(value, transformedSlugs);
}

async function generateDiffWithCount(source: NestedObject, target: NestedObject, transformer?: (v: string) => Promise<string>, useIcuLabel: boolean = false) : Promise<[NestedObject, number]> {
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
            if (!getValue(target, targetPath) && !useIcuLabel) {
                const value = transformer ? await transformer(entryValue): entryValue;
                return cb(setValue(diff, targetPath, value));
            }
            if (!getValue(target, targetPath) && useIcuLabel) {
                const value = await translateIcuLabel(entryValue, transformer);
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
    generateDiffWithCount
}