module.exports = ({region}) => {
    const AWS = require('aws-sdk');
    const translate = new AWS.Translate({
        apiVersion: '2017-07-01',
        region
    });

    return {
        translate: function(text, target) {
            return new Promise((resolve, reject) => {
                const params = {
                    SourceLanguageCode: 'en',
                    TargetLanguageCode: target,
                    Text: text
                };

                translate.translateText(params, (err, data) => {
                    err ? reject(err) : resolve([data.TranslatedText]);
                });
            });
        }
    }
};