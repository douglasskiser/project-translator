const path = require('path');
const merge = require('lodash/merge');
const {doesFileExist, readFile, writeFile} = require('../utils/file.utils');
const {STATUS} = require('../utils/logging.utils');
const {processTranslationObject, getDeltaCount} = require('../utils/process.utils');
const {generateProgressBar, generateLog} = require('../utils/common.utils');
const googleProvider = require('../providers/google.provider');
const awsProvider = require('../providers/aws.provider');
const providers = require('../constants/providers');

const messages = {
    outputLanguagesError: 'Please provide output languages using the OUTPUT_LANGUAGES environment variable or outputLanguages config value',
    inputLanguageError: 'Please provide an input language using the INPUT_LANGUAGE environment variable or inputLanguage config value',
    translationsDirectoryError: 'Please provide a translation directory using the TRANSLATIONS_DIRECTORY environment variable or translationsDirectory config value',
    noInputDataError: 'Your source language file is empty',
    projectIdError: 'Please provide a valid project id using the PROJECT_ID environment variable or projectId config value',
    translateFromTo: (inputLanguage, outputLanguage) => `translating ${inputLanguage} to ${outputLanguage}`,
    translateFromToComplete: (inputLanguage, outputLanguage) => `translating ${inputLanguage} to ${outputLanguage} complete`,
    providerError: 'Please provide a service provider using the PROVIDER environment variable or provider config value',
    regionError: 'Please provide a AWS region using the REGION environment variable or region config value',
    noRcFileError: 'translaterc.json file does not exist. run `translate init` to create one.',
    nothingNewToTranslate: outputLanguage => `${outputLanguage} has nothing new to translate`
};

async function getOptions() {
    const isRcFile = await doesFileExist(path.resolve('./.translaterc.json'));
    if (isRcFile) {
        const {
            provider,
            projectId,
            translationsDirectory,
            inputLanguage,
            outputLanguages,
            region
        } = await readFile({
            filePath: path.resolve('./.translaterc.json')
        });
        
        return {
            provider,
            projectId,
            translationsDirectory,
            inputLanguage,
            region,
            outputLanguages: outputLanguages.split(',')
        };
    }
    generateLog({
        message: messages.noRcFileError,
        type: STATUS.ERROR
    });
}

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
        message: messages.translateFromToComplete(inputLanguage, outputLanguage),
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
        message: messages.translateFromTo(inputLanguage, outputLanguage),
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
            message: messages.translateFromTo(inputLanguage, outputLanguage),
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
            outputData: merge(outputData, newTranslations)
        });
    } else {
        generateLog({
            message: messages.nothingNewToTranslate(outputLanguage),
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

async function translate() {
    const {
        provider,
        projectId,
        translationsDirectory,
        inputLanguage,
        outputLanguages,
        region
    } = await getOptions();
    const translate = {
        [providers.AWS]: () => awsProvider({region}),
        [providers.GOOGLE]: () => googleProvider({projectId})
    }[provider]();

    outputLanguages.reduce(async (lastPromise, outputLanguage) => {
        await lastPromise;
        return translateLanguageFile({
            translationsDirectory,
            inputLanguage,
            outputLanguage,
            translate
        });
    }, Promise.resolve());
}

module.exports = translate;