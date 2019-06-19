[![Build Status](https://travis-ci.com/douglasskiser/project-translator.svg?token=ayjxjPepPztxATpEppTC&branch=master)](https://travis-ci.com/douglasskiser/project-translator)

# project-translator
A translator for web applications that uses providers such as Google and AWS.

## Install
`npm i -g ./`

## Use
`...ENVRIONEMENT_VARIABLES project-translator`

## Setup By Service Provider

### Google
  Before running application you will need to export your Google Application Credentials so that you can authenticate with Google's service.
  `export GOOGLE_APPLICATION_CREDENTIALS="./path-to/credentials.json"`

### AWS
  Use the same setup as you would to use the aws-cli found here https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html

## Environment variables  
  Use environment variables to let the translator know about your project. All variables are required for the translator to run unless not applicable to your service provider.

  `PROVIDER` the service provider you are using. Google and AWS are supported.  
  `PROJECT_ID` the project id of your Google service account if using the Google service provider  
  `REGION` your AWS region if using the AWS service provider
  `TRANSLATIONS_DIRECTORY` the directory that contains your translation files  
  `INPUT_LANGUAGE` the source language  
  `OUTPUT_LANGUAGES` a list of output languages

## Configuration
  If environment variables are not your thing. You have alternate options to configure the translator. Whichever option you choose to configure must contain all configurations. You cannot use more than one configuration option at one time as we will use the first one we find.

### Options
  Pass options by adding the `--` flag after you call the translater to signify you want to configure using options and pass your configurations like this `--myOption=value`.

  `--provider` the service provider you are using. Google and AWS are supported.  
  `--projectId` the project id of your Google service account if using the Google service provider  
  `--region` your AWS region if using the AWS service provider  
  `--translationsDirectory` the directory that contains your translation files  
  `--inputLanguage` the source language  
  `--outputLanguages` a list of output languages

### RC File
  You also have the option to use an RC file to set your configurations. Do this by adding a `.translaterc.json` file in the root directory of your project. All the same configs as options apply. An example of a AWS configuration is

    `{
      "provider": "aws"
      "region": "us-east-1",
      "translationsDirectory": "./translations",
      "inputLanguage": "en-US",
      "outputLanguages": "es-MX,fr-FR"
    }`
