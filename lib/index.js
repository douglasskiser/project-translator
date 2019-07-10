const program = require('commander');
const init = require('./commands/init');
const translate = require('./commands/translate');

const commands = [{
    command: 'translate',
    alias: 't',
    description: 'Translate project',
    action: () => translate()
}, {
    command: 'init',
    alias: 'i',
    description: 'Create setup file in your project',
    action: () => init()
}];

program
    .version('1.0.0')
    .description('Project translator');

commands.forEach(({command, alias, description, action}) => {
    program
        .command(command)
        .alias(alias)
        .description(description)
        .action(action);
});

program.parse(process.argv);
