import {v2} from '@google-cloud/translate';

export default function provider(projectId: string) {
    const translator = new v2.Translate({projectId});
    return {
        translate: (_: string, targetLanguage: string) => async function (text:string) {
            const [translation] = await translator.translate(text, targetLanguage);
            return translation;
        }
    };
}