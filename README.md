[![NPM Version](https://img.shields.io/npm/v/project-translator)](https://www.npmjs.com/package/project-translator)

# project-translator
A translator for web applications that uses AWS, GCP, or any custom provider.

## Install
```sh
npx project-translator
```
```sh
npm i --save-dev project-translator
```

### Setup
To configure your project to use the project-translator you only need `.translaterc.json` file in the root of your project. You can run `project-translator init` to auto generate this file.

Example .translaterc.json
```javascript
{
  "provider": "aws", // aws | google | custom
  "translationDir": "lib/translations",
  "sourceLanguage": "en-US",
  "outputLanguages": [
    "fr-FR", "es-ES"
  ],
  "region": "us-east-1" // when using AWS
  "projectId": "my-project1" // when using Google
}
 ```

### Google Setup
To use Google as your translate provider you will need to export your application credentials so that you can authenticate with Google's service.

```sh
export GOOGLE_APPLICATION_CREDENTIALS="./path-to/credentials.json"
```

### AWS Setup
To use AWS as your translate provider, follow the aws-cli setup found here https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html
   
  
### File/File-Name Structure
Translation files shoud be in JSON format and use naming convention that beings with a two letter language code  (e.g 'en.json' or 'en-US.json'). While translating the translations directory provided in the configuration file as `translationsDir` will be used to find, create or update translation files.

Example Source Translation File
```javascript
// en-US.json
{
  "my-label": "My Label",
  "section-label": "Label for a section",
  "section-header": {
    "title": "A Title",
    "description": "A description"
  },
  "another.section.header": "Title"
}
 ```

 ### Use Translator
`npx project-translator translate`


 To start translating, ensure you have a source language file in your translations directory. This source file's language code should be configured in your `.translaterc.json` file. Now run `npx project-translator translate` or install and use in your package.json scripts.

 Example package.json
 ```json
 {
  "scripts": {
    "translate": "project-translator translate"
  }
 }
 ```

 ### Custom Translate Provider

 To use a customer provider you can provide these values in your `.translaterc.json` file.

 ```json
 {
  "provider": "custom",
  "translatorPath": "./path-to/custom-translator.js"
 }
 ```

 Example Custom Translator
 ```javascript
 export default function customTranslator() {
  return {
    translate:
      (sourceLanguage:string, targetLanguage:string) => async function(text:string) {
        // put you custom translate code here.
        const translatedText = await customProvider(text, sourceLanguage, targetLanguage);
        // Ensure it returns the translated text.
        return translatedText;
      }
  };
 }
 ```
