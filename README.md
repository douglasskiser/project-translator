[![NPM Version](https://img.shields.io/npm/v/project-translator)](https://www.npmjs.com/package/project-translator)
[![Build Status](https://travis-ci.com/douglasskiser/project-translator.svg?token=ayjxjPepPztxATpEppTC&branch=master)](https://travis-ci.com/douglasskiser/project-translator)

# project-translator
A translator for web applications that uses providers such as Google and AWS.

## Install
`npm i -g project-translator`

### Use
First, you need to create a configuration file. You can do this by going to the root of your project and running `project-translator init`. The prompts will ask some questions about your project and provider and create a ./translaterc.json file for you. After you have your project configured you can run the translator using `project-translator translate` to generate your translations.

### Google Setup
  Before running you will need to export your Google Application Credentials so that you can authenticate with Google's service.
  `export GOOGLE_APPLICATION_CREDENTIALS="./path-to/credentials.json"`

### AWS Setup
  Use the same setup as you would to use the aws-cli found here https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html
   
  
### File/File-Name Structure
The translator uses the translations directory provided as the path for all translation files. The translator assumes everything is in JSON and it also assumes a naming translations file naming convention that begins with a two letter language code (e.g 'en.json' or 'en-US.json'). The translator also assumes that your JSON file is composed of objects and strings.

Example File
```javascript
// en-US.json
{
  "my-label": "My Label",
  "app-section: {
    "section-label": "Label for a section"
    "section-header": {
      "title": "A Title",
      "description" "A description"
    }
  }
}
 ```
