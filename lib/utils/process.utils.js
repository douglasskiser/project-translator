const get = require('lodash/get');
const set = require('lodash/set');
const last = require('lodash/last');
const isObject = require('lodash/isObject');
const isString = require('lodash/isString');
const {generateLog} = require('./common.utils');
const {STATUS} = require('./logging.utils');

async function translateText({
  text,
  target,
  translate
}) {
  try {
    const results = await translate.translate(text, target);
    return results[0];
  } catch (err) {
    generateLog({
      message: err,
      type: STATUS.ERROR
    });
  }
}

function getNewRootKey(nextItemToProcess) {
  const existingRootKey = nextItemToProcess[2];
  const nextPath = nextItemToProcess[0];
  return !!existingRootKey
    ? existingRootKey + '.' + nextPath
    : nextPath;
}

async function processTranslationObject({
  inputData,
  outputData,
  rootKey,
  forLater,
  targetLanguage,
  progressBar,
  translate
}) {
  let results;

  function handleDataForLater({
    dataForLater,
    dataForOutput
  }) {
    const [nextItemToProcess, ...rest] = dataForLater;
    const newRootKey = getNewRootKey(nextItemToProcess);

    return processTranslationObject({
      inputData: {
        [nextItemToProcess[0]]: nextItemToProcess[1]
      },
      outputData: dataForOutput,
      rootKey: newRootKey,
      forLater: [...rest],
      targetLanguage,
      progressBar,
      translate
    });
  }

  async function handleNoRootKey() {
    let _outputData = outputData || {};
    let _forLater = forLater || [];
    for (let key in inputData) {
      if (inputData.hasOwnProperty(key) && isString(inputData[key])) {
        const translatedData = await translateText({
          text: inputData[key],
          target: targetLanguage,
          translate
        });
        set(_outputData, key, translatedData);
        progressBar.increment();
      }
      if (inputData.hasOwnProperty(key) && isObject(inputData[key])) {
        _forLater.push([
          key,
          inputData[key]
        ]);
      }
    }
    return {
      _outputData,
      _forLater
    };
  }

  async function handleHasRootKey() {
    let _outputData = outputData || {};
    let _forLater = forLater || [];
    set(_outputData, rootKey, {});

    const data = get(inputData, last(rootKey.split('.')));

    for (let key in data) {
      if (data.hasOwnProperty(key) && isString(get(data, key))) {
        const translatedData = await translateText({
          text: get(data, key),
          target: targetLanguage,
          translate
        });
        set(_outputData, rootKey + '.' + key, translatedData);
        progressBar.increment();
      }
      if (data.hasOwnProperty(key) && isObject(get(data, key))) {
        _forLater.push([
          key,
          data[key],
          rootKey
        ]);
      }
    }

    return {
      _outputData,
      _forLater
    };
  }

  results = !!rootKey ? await handleHasRootKey() : await handleNoRootKey();

  if (!!results._forLater.length) {
    return handleDataForLater({
      dataForLater: results._forLater,
      dataForOutput: results._outputData
    });
  }

  return results._outputData;
}

function getDeltaCount({
  inputData,
  outputData,
  rootKey,
  forLater,
  count,
  delta
}) {
  let results;

  function handleNoRootKey() {
    let _count = count || 0;
    let _forLater = forLater || [];
    let _delta = delta || {};

    for (let key in inputData) {
      if (inputData.hasOwnProperty(key) && isString(inputData[key]) && !get(outputData, key)) {
        _count++;
        set(_delta, key, inputData[key]);
      }
      if (inputData.hasOwnProperty(key) && isObject(inputData[key])) {
        _forLater.push([
          key,
          inputData[key]
        ]);
      }
    }
    return {
      _count,
      _forLater,
      _delta
    };
  }

  function handleHasRootKey() {
    const data = get(inputData, last(rootKey.split('.')));
    let _count = count || 0;
    let _forLater = forLater || [];
    let _delta = delta || {};

    for (let key in data) {
      if (data.hasOwnProperty(key) && isString(get(data, key)) && !get(outputData, `${rootKey}.${key}`)) {
        _count++;
        set(_delta, `${rootKey}.${key}`, get(data, key));
      }
      if (data.hasOwnProperty(key) && isObject(get(data, key))) {
        _forLater.push([
          key,
          data[key],
          rootKey
        ]);
      }
    }

    return {
      _count,
      _forLater,
      _delta
    };
  }

  function handleDataForLater({
    dataForLater,
    dataCount,
    dataDelta
  }) {
    const [nextItemToProcess, ...rest] = dataForLater;
    const newRootKey = getNewRootKey(nextItemToProcess);

    return getDeltaCount({
      inputData: {
        [nextItemToProcess[0]]: nextItemToProcess[1]
      },
      rootKey: newRootKey,
      forLater: [...rest],
      count: dataCount,
      delta: dataDelta,
      outputData
    });
  }

  results = !!rootKey ? handleHasRootKey() : handleNoRootKey();

  if (!!results._forLater.length) {
    return handleDataForLater({
      dataForLater: results._forLater,
      dataCount: results._count,
      dataDelta: results._delta
    });
  }

  return {
    count: results._count,
    delta: results._delta
  };
}

const processUtils = {
  processTranslationObject,
  getDeltaCount
};

module.exports = processUtils;