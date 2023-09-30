#!/usr/bin/env node
import { Command } from 'commander';
import { onExit } from './utils/event';
import { createErrorLog } from './utils/log';
import { InitCommand } from './actions/init';
import { TranslateCommand } from './actions/translate';



async function main() {
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
            action: async () => await translateCommand.run()
        }
    ]
        .forEach(command => {
            program
                .command(command.name)
                .alias(command.alias)
                .description(command.description)
                .action(async () => await command.action());
        });
    [initCommand, translateCommand].forEach(command => {
        command.on('start', () => console.log('starting'));
        command.on('info', (message: string) => console.log(message));
        command.on('error', (err: Error) => {
            createErrorLog(err);
            onExit(1, program);
        });
        command.on('done', (message?: string) => console.log(message || 'done'));
    });
    await program.parseAsync();
}

main().then(() => process.exit(0));
