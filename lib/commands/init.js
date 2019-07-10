const {prompt, ui} = require('inquirer');
const providers = require('../constants/providers');
const {doesFileExist, writeFile} = require('../utils/file.utils');
const {onError} = require('../utils/common.utils');
const path = require('path');

async function writeFileAndExit({configs, uiBottomBar, providerSelection}) {
    await writeFile({
        filePath: path.resolve('./.translaterc.json'),
        content: JSON.stringify({...configs, ...providerSelection})
    });

    uiBottomBar.log.write('\nYour configuration file has been created.');
}

async function checkForExistingRCFile() {
    const isRcFile = await doesFileExist(path.resolve('./.translaterc.json'));
    
    if (isRcFile) {
        const shouldOverwriteExistingConfigs = await prompt([{
            type: 'list',
            name: 'overwrite',
            message: 'You have an existing translaterc file. would you like to overwrite your existing configs?',
            choices: ['Yes', 'No']
        }]);
        shouldOverwriteExistingConfigs.overwrite === 'No' && onError();
    } 
}

async function init() {
    await checkForExistingRCFile();
    const uiBottomBar = new ui.BottomBar();
    const providerSelection = await prompt([{
        type: 'list',
        name: 'provider',
        message: 'Select Provider',
        choices: [providers.AWS, providers.GOOGLE]
    }]);
    const commonConfigPrompts = [{
        type: 'input',
        name: 'translationsDirectory',
        message: 'Enter path to directory with translations (e.g. ./translations) ...'
    }, {
        type: 'input',
        name: 'inputLanguage',
        message: 'Enter the source language (e.g. en-US or en) ...'
    }, {
        type: 'input',
        name: 'outputLanguages',
        message: 'Enter a list of output languages (e.g. es-MX,fr-FR or es,fr) ...'
    }];
    const providerActions = {
        [providers.AWS]: async function() {
            const configs = await prompt([{
                type: 'input',
                name: 'region',
                message: 'Enter AWS region ...'
            }, ...commonConfigPrompts]);

            await writeFileAndExit({configs, uiBottomBar, providerSelection});
        },
        [providers.GOOGLE]: async () => {
            const configs = await prompt([{
                type: 'input',
                name: 'projectId',
                message: 'Enter google project ID ...'
            }, ...commonConfigPrompts]);

            await writeFileAndExit({configs, uiBottomBar, providerSelection});
        }
    }[providerSelection.provider];
    await providerActions();
}

module.exports = init;