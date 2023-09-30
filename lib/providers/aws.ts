import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';

function provider(region: string) {
    return {
        translate: (sourceLanguage: string, targetLanguage: string) => async function (text: string) {
            try {
                const client = new TranslateClient({ region });
                const command = new TranslateTextCommand({
                    SourceLanguageCode: sourceLanguage.split('-')[0],
                    TargetLanguageCode: targetLanguage.split('-')[0],
                    Text: text
                });
                const response = await client.send(command);
                return response.TranslatedText;
            } catch (err) {
                return Promise.reject(err);
            }
        }
    };
}

export default provider;