const path = require('path');
const {STATUS} = require('./utils/logging.utils');
const {processTranslationObject, getDeltaCount} = require('./utils/process.utils');
const {generateProgressBar, generateLog} = require('./utils/common.utils');
const {doesFileExist, writeFile, readFile} = require('./utils/file.utils');
const googleProvider = require('./providers/google.provider');
const awsProvider = require('./providers/aws.provider');

const PROVIDERS = {
    GOOGLE: 'google',
    AWS: 'aws'
};

const messages = {
    outputLanguagesError: 'Please provide output languages using the OUTPUT_LANGUAGES environment variable or outputLanguages config value',
    inputLanguageError: 'Please provide an input language using the INPUT_LANGUAGE environment variable or inputLanguage config value',
    translationsDirectoryError: 'Please provide a translation directory using the TRANSLATIONS_DIRECTORY environment variable or translationsDirectory config value',
    noInputDataError: 'Your source language file is empty',
    projectIdError: 'Please provide a valid project id using the PROJECT_ID environment variable or projectId config value',
    translateFromTo: (inputLanguage, outputLanguage) => `translating ${inputLanguage} to ${outputLanguage}`,
    providerError: 'Please provide a service provider using the PROVIDER environment variable or provider config value',
    regionError: 'Please provide a AWS region using the REGION environment variable or region config value'
};

function getInputData({inputLanguage, translationsDirectory}) {
    return new Promise((resolve, reject) => {
        const filePath = path.resolve(translationsDirectory + `/${inputLanguage}.json`);
        const inputJson = require(filePath);
        !!inputJson && !!Object.keys(inputJson).length
            ? resolve(inputJson)
            : reject(messages.noInputDataError);
    });
}

async function getOutputData({outputLanguage, translationsDirectory}) {
    const filePath = path.resolve(translationsDirectory + `/${outputLanguage}.json`);
    const doesLanguageFileExist = await doesFileExist(filePath);

    return doesLanguageFileExist
        ? readFile({filePath})
        : Promise.resolve(null);
}

async function generateOutputLangageData({
    inputData,
    targetLanguage,
    numberOfKeysToTranslate,
    translate
}) {
    const progressBar = generateProgressBar();

    progressBar.start(numberOfKeysToTranslate, 0);

    const outputData = await processTranslationObject({
        inputData,
        progressBar,
        targetLanguage,
        translate
    });

    progressBar.stop();

    return outputData;
}

async function writeTranslationFile({
    translationsDirectory,
    outputLanguage,
    inputLanguage,
    outputData
}) {
    await writeFile({
        filePath: path.resolve(translationsDirectory + `/${outputLanguage}.json`),
        content: JSON.stringify(outputData)
    });
    
    generateLog({
        message: `translating ${inputLanguage} to ${outputLanguage} complete`,
        type: STATUS.SUCCESS
    });
}

async function generateNewTranslationFile({
    outputLanguage,
    inputData,
    inputLanguage,
    translationsDirectory,
    targetLanguage,
    translate
}) {
    generateLog({
        message: `translating ${inputLanguage} to ${outputLanguage}`,
        type: STATUS.INFO
    });
    const {count} = getDeltaCount({
        inputData, outputData: {}
    });
    const outputData = await generateOutputLangageData({
        targetLanguage,
        inputData,
        translate,
        numberOfKeysToTranslate: count
    });
    await writeTranslationFile({
        translationsDirectory,
        outputLanguage,
        inputLanguage,
        outputData
    });
}

async function updateTranslationFile({
    outputLanguage,
    inputLanguage,
    translationsDirectory,
    targetLanguage,
    inputData,
    outputData,
    translate
}) {
    const {count, delta} = getDeltaCount({
        inputData, outputData
    });
    
    if (count) {
        generateLog({
            message: `translating ${inputLanguage} to ${outputLanguage}`,
            type: STATUS.INFO
        });
        const newTranslations = await generateOutputLangageData({
            inputData: delta,
            numberOfKeysToTranslate: count,
            targetLanguage,
            translate
        });
        await writeTranslationFile({
            translationsDirectory,
            outputLanguage,
            inputLanguage,
            outputData: {
                ...outputData,
                ...newTranslations
            }
        });
    } else {
        generateLog({
            message: `${outputLanguage} has nothing new to translate`,
            type: STATUS.INFO
        });
    }
}

async function translateLanguageFile({
    inputLanguage,
    outputLanguage,
    translationsDirectory,
    translate
}) {
    const targetLanguage = outputLanguage.split('-')[0];
    const inputData = await getInputData({
        translationsDirectory,
        inputLanguage
    });
    const outputData = await getOutputData({
        translationsDirectory,
        outputLanguage
    });
    if (!outputData) {
        await generateNewTranslationFile({
            outputLanguage,
            inputLanguage,
            translationsDirectory,
            targetLanguage,
            inputData,
            translate
        });
    } else {
        await updateTranslationFile({
            outputLanguage,
            inputLanguage,
            translationsDirectory,
            targetLanguage,
            inputData,
            outputData,
            translate
        });
    }
}

async function getOptions() {
    const isRcFile = await doesFileExist(path.resolve('./.translaterc.json'));
    if (isRcFile) {
        return await readFile({
            filePath: path.resolve('./.translaterc.json')
        });
    }
    const isOptions = process.argv[2] === '--';
    if (isOptions) {
        return process.argv.slice(3).reduce((configs, option) => {
            const [optionKey, optionValue] = option.split('--')[1].split('=');
            return {
                ...configs,
                [optionKey]: optionValue
            }
        }, {});
    }
    return {
        projectId: process.env.PROJECT_ID,
        translationsDirectory: process.env.TRANSLATIONS_DIRECTORY,
        inputLanguage: process.env.INPUT_LANGUAGE,
        outputLanguages: process.env.OUTPUT_LANGUAGES,
        provider: process.env.PROVIDER,
        region: process.env.REGION
    };
}

async function getUserInputData() {
    const options = await getOptions();
    const {
        provider,
        projectId,
        translationsDirectory,
        inputLanguage,
        outputLanguages,
        region
    } = options;
    if (!provider) {
        generateLog({
            message: messages.providerError,
            type: STATUS.ERROR
        });
    }
    const commonConfigs = [
        'translationsDirectory',
        'inputLanguage',
        'outputLanguages'
    ];
    const providerConfigs = {
        [PROVIDERS.GOOGLE]: ['projectId'],
        [PROVIDERS.AWS]: ['region']
    }[provider];
    [...commonConfigs, ...providerConfigs].forEach(requiredConfig => {
        if (!options[requiredConfig]) {
            generateLog({
                message: messages[requiredConfig + 'Error'],
                type: STATUS.ERROR
            });
        }
    })

    return {
        provider,
        projectId,
        translationsDirectory,
        inputLanguage,
        region,
        outputLanguages: outputLanguages.split(',')
    };
}

async function translateProject() {
    const {
        provider,
        projectId,
        translationsDirectory,
        inputLanguage,
        outputLanguages,
        region
    } = await getUserInputData();
    const translate = {
        [PROVIDERS.AWS]: () => awsProvider({region}),
        [PROVIDERS.GOOGLE]: () => googleProvider({projectId})
    }[provider]();
    const numberOfOutputLanguages = outputLanguages.length;

    for (let index = 0; index < numberOfOutputLanguages; index++) {
        await translateLanguageFile({
            translationsDirectory,
            inputLanguage,
            outputLanguage: outputLanguages[index],
            translate
        });
    }

    process.exit(0);
}

module.exports = translateProject;