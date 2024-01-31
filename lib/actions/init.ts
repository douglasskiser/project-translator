interface PromptInput {
    message: string
    name: string
    type: string
    choices?: string[]
    default?: string
}

import inquirer from 'inquirer';
import { doesFileExist, writeFile } from '../utils/file';
import { resolve } from 'path';
import { RC_FILE_PATH } from '../constants/rc';
import { AWS, GOOGLE, CUSTOM } from '../constants/providers';
import { EventEmitter } from 'events';

export class InitCommand extends EventEmitter {
    async run() {
        this.emit('start');
        try {
            const isConfigFile = await this.doesConfigFileExist();
            const overwrite = isConfigFile && await this.doesUserWantToOverwriteConfigFile();
            if (isConfigFile && !overwrite) {
                this.emit('done');
                return;
            }
            const userInputs = await this.getConfigsFromUser();
            await writeFile(resolve(process.cwd(), RC_FILE_PATH), JSON.stringify(userInputs, null, 2));
            this.emit('info', '.translationrc.json file has been generated')
            this.emit('done');
            return;
        } catch (err) {
            this.emit('error', err);
        }
    }
    async doesConfigFileExist() {
        return await doesFileExist(resolve(process.cwd(), RC_FILE_PATH));
    }
    async doesUserWantToOverwriteConfigFile() {
        const { overwrite } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwrite',
            message: 'Would you like to overwrite your existing .translaterc.json file?'
        }]);
        return overwrite;
    }
    async getConfigsFromUser() {
        const provider = await this.getInputFromUser({
            name: 'provider',
            message: 'Which provider do you want to use?',
            type: 'list',
            choices: [AWS, GOOGLE, CUSTOM]
        });
        return await this.getUserInputs(provider);
    }
    async getInputFromUser({
        message, name, type, choices
    }: {
        message: string, name: string, type: string, choices?: string[]
    }) {
        const answer = await inquirer.prompt([{
            message, name, type, choices
        }]);
        return answer[name];
    }
    async getUserInputs(provider: 'aws' | 'google' | 'custom') {
        const inputs: (PromptInput | false)[] = [
            {
                name: 'translationDir',
                message: 'Enter path to directory with translations.',
                type: 'input',
                default: './translations'
            },
            {
                name: 'sourceLanguage',
                message: 'Enter the source language.',
                type: 'input',
                default: 'en-US'
            },
            {
                name: 'outputLanguages',
                message: 'Enter a comma-separated list of output languages.',
                type: 'input',
                default: 'es-ES,fr-FR,ja-JP'
            },
            {
                name: 'useIcuLabel',
                message: 'Are you using ICU labels?.',
                type: 'confirm'
            },
            provider === 'aws' && {
                name: 'region',
                message: 'Enter AWS region.',
                type: 'input',
                default: 'us-east-1'
            },
            provider === 'google' && {
                name: 'projectId',
                message: 'Enter google project id.',
                type: 'input'
            },
            provider === 'custom' && {
                name: 'translatorPath',
                message: 'Enter the file path of your custom translator.',
                type: 'input'
            }
        ];
        const results = { provider };
        for (const input of this.compact(inputs)) {
            results[input.name] = await this.getInputFromUser(input);
            if (input.name === 'outputLanguages') {
                results[input.name] = results[input.name].split(',')
            }
        }
        return results;
    }
    compact(arr: (false | PromptInput)[]) {
        return arr.reduce((compacted: PromptInput[], value: false | PromptInput) => {
            if (value) {
                return [...compacted, value];
            }
            return [...compacted];
        }, []);
    }
}
