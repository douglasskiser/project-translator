type TranslateOptionsAttribute = 'region' | 'translationDir' | 'translatorPath' | 'projectId' | 'sourceLanguage' | 'outputLanguages' | 'provider';

interface TranslateOptions {
    provider: 'aws' | 'google' | 'custom'
    sourceLanguage: string
    outputLanguages: string[]
    translationDir: string
    region?: string
    projectId?: string
    translatorPath?: string
    useIcuLabels?: boolean
}

interface Translator {
    translate: (sourceLanguage: string, targetLanguage: string) => (text: string) => Promise<string>
}

import { merge } from 'lodash';
import awsProvider from '../providers/aws';
import googleProvider from '../providers/google';
import { resolve } from 'path';
import { doesFileExist, readFile, writeFile } from '../utils/file';
import { NestedObject, generateDiffWithCount } from '../utils/process';
import { AWS, GOOGLE, CUSTOM } from '../constants/providers';
import { RC_FILE_PATH } from '../constants/rc';
import {EventEmitter} from 'events';

export class TranslateCommand extends EventEmitter {
    _debug = false;
    messages = {
        translateFromTo: (text: string, inputLanguage: string, outputLanguage: string) => `Translating ${text} from ${inputLanguage} to ${outputLanguage}`,
        noRcFileError: 'translaterc.json file does not exist. run `translate init` to create one',
        nothingNewToTranslate: (outputLanguage: string) => `${outputLanguage} has nothing new to translate`,
        invalidConfigurations: 'translaterc.json file has invalid configurations',
        fileTranslated: (outputLanguage: string) => `${outputLanguage} has been translated`,
        translationComplete: 'translation complete...'
    }
    debug() {
        this._debug = true;
    }
    async run() {
        try {
            this.emit('start');
            const options = await this.getOptions() as TranslateOptions;
            const translators = {
                [AWS]: async () => awsProvider(options.region as string),
                [GOOGLE]: async () => googleProvider(options.projectId as string),
                [CUSTOM]: async () => await this.getCustomTranslator(options.translatorPath as string)
            };
            const translator = await translators[options.provider]() as Translator;
            await Promise.all(options.outputLanguages.map(async (targetLanguage) => {
                return await this.translateLanguageFile(
                    options.sourceLanguage,
                    targetLanguage,
                    options.translationDir,
                    translator,
                    options.useIcuLabels
                )
            }));
            this.emit('done', this.messages.translationComplete);
        } catch (err) {
            this.emit('error', err);
        }
    }
async getOptions() {
        const isRcFile = await doesFileExist(resolve(RC_FILE_PATH));
        if (!isRcFile) {
            throw new Error(this.messages.noRcFileError);
        }
        const options = await readFile(resolve(RC_FILE_PATH)) as TranslateOptions;
        if (!this.isOptionsValid(options)) {
            throw new Error(this.messages.invalidConfigurations);
        }
        return options
    }
    async getCustomTranslator(translatorPath: string) {
        try {
            const translator = await import(resolve(process.cwd(), translatorPath));
            return translator.default();
        } catch (_) {
            throw new Error('Error importing custom translator');
        }
    }
    async translateLanguageFile(
        inputLanguage: string,
        outputLanguage: string,
        translateDir: string,
        translator: { translate: (s: string, t: string) => (v: string) => Promise<string> },
        useIcuLabels: boolean | undefined = false
    ) {
        const sourceLanguageFile = await this.getLanguageFile(inputLanguage, translateDir) as NestedObject;
        const targetLanguageFile = await this.getLanguageFile(outputLanguage, translateDir) as NestedObject;
        const translatorWithLog = (text: string) => {
            this._debug && this.emit('info', this.messages.translateFromTo(text, inputLanguage, outputLanguage));
            return translator.translate(inputLanguage, outputLanguage)(text);
        }
        const [delta, count] = await generateDiffWithCount(sourceLanguageFile, targetLanguageFile || {}, translatorWithLog, useIcuLabels);
        if (count) {
            const path: string = resolve(translateDir + `/${outputLanguage}.json`);
            await writeFile(path, JSON.stringify(merge(targetLanguageFile || {}, delta), null, 2));
            this._debug && this.emit('info', this.messages.fileTranslated(outputLanguage))
        } else {
            this._debug && this.emit('info', this.messages.nothingNewToTranslate(outputLanguage));
        }
    }
    async getLanguageFile(outputLanguage: string, translationsDirectory: string) {
        const path: string = resolve(translationsDirectory + `/${outputLanguage}.json`);
        const doesLanguageFileExist = await doesFileExist(path);
    
        return doesLanguageFileExist
            ? await readFile(path)
            : null;
    }
    isOptionsValid(options: TranslateOptions) {
        const isTranslationsDirValid = this.isOptionValid(options, 'translationDir');
        const isSourceLanguageValid = this.isOptionValid(options, 'sourceLanguage');
        const isOutputLanguagesValid = this.isOptionValid(options, 'outputLanguages');
        const isProviderValid = this.isOptionValid(options, 'provider');
        const isCommonConfigsValid = isTranslationsDirValid && isSourceLanguageValid && isOutputLanguagesValid && isProviderValid;
        if (!isCommonConfigsValid) {
            return false;
        }
        if (options.provider === AWS) {
            return this.isOptionValid(options, 'region');
        }
        if (options.provider === GOOGLE) {
            return this.isOptionValid(options, 'projectId');
        }
        return this.isOptionValid(options, 'translatorPath');
    }
    isOptionValid(options: TranslateOptions, option: TranslateOptionsAttribute) {
        const isValid = options[option] !== undefined;
        !isValid && this._debug && this.emit('info', `Invalid or missing configuration for ${option}`);
        return isValid;
    }
}
