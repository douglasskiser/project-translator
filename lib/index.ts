#!/usr/bin/env node
import { Command } from 'commander';
import { onExit } from './utils/event';
import { createErrorLog } from './utils/log';
import { InitCommand } from './actions/init';
import { TranslateCommand } from './actions/translate';

async function main() {
    console.log('\n');
    const program = new Command();
    const initCommand = new InitCommand();
    const translateCommand = new TranslateCommand();
    program.version('2.0.0');
    program.description('A project translator');
    process.on('unhandledRejection', (err: Error) => {
        createErrorLog(err);
        onExit(0, program);
    });
    [
        {
            name: 'init',
            alias: 'i',
            description: 'Create .translaterc file in your project.',
            action: async () => await initCommand.run()
        },
        {
            name: 'translate',
            alias: 't',
            description: 'Translate project labels.',
            action: async (options: {debug: boolean}) => {
                options.debug && translateCommand.debug();
                await translateCommand.run()
            },
            options: [
                ['-d', 'display logs']
            ]
        }
    ]
        .forEach(command => {
            program
                .command(command.name)
                .alias(command.alias)
                .description(command.description)
                .action(async (options) => await command.action(options));
            if (command.options && command.options.length) {
                command.options.forEach(option => {
                    program.option(option[0], option[1])
                })
            }
            
        });
    [initCommand, translateCommand].forEach(command => {
        command.on('info', (message: string) => console.log(message));
        command.on('error', (err: Error) => {
            createErrorLog(err);
            onExit(1, program);
        });
        command.on('done', (message?: string) => {
            message && console.log(message);
            console.log('\n');
        });
    });
    await program.parseAsync();
}

main().then(() => process.exit(0));
