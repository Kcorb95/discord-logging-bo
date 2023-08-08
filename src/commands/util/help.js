const Command = require('../../struct/Command');

class HelpCommand extends Command {
    constructor() {
        super('help', {
            aliases: ['help'],
            category: 'util',
            clientPermissions: ['EMBED_LINKS'],
            quoted: false,
            args: [
                {
                    id: 'command',
                    type: 'commandAlias',
                    prompt: {
                        start: 'Which command do you need help with?',
                        retry: 'Please provide a valid command.',
                        optional: true
                    }
                }
            ],
            description: {
                content: 'Displays a list of commands or information about a command.',
                usage: '[command]',
                examples: ['', 'star', 'remove-rep']
            }
        });
        this.protected = true;
    }

    exec(message, { command }) {
        if (!command) return this.execCommandList(message);

        const prefix = this.handler.prefix(message);
        const description = Object.assign({
            content: 'No description available.',
            usage: '',
            examples: [],
            fields: []
        }, command.description);

        const embed = this.client.util.embed()
            .setColor('#8387db')
            .setTitle(`\`${prefix}${command.aliases[0]} ${description.usage}\``)
            .addField('Description', description.content);

        for (const field of description.fields) embed.addField(field.name, field.value);

        if (description.examples.length) {
            const text = `${prefix}${command.aliases[0]}`;
            embed.addField('Examples', `\`${text} ${description.examples.join(`\`\n\`${text} `)}\``, true);
        }

        if (command.aliases.length > 1) {
            embed.addField('Aliases', `\`${command.aliases.join('` `')}\``, true);
        }

        return message.util.send({ embed });
    }

    async execCommandList(message) {
        const embed = this.client.util.embed()
            .setColor('#8387db')
            .addField('Command List', [
                `To view details for a command, do \`${this.handler.prefix(message)}help <command>\``
            ]);

        for (const category of this.handler.categories.values()) {
            const title = {
                config: '❯ Config',
                permissions: '❯ Permissions',
                botOwner: '❯ Bot Owner',
                guildOwner: '❯ Guild Owner',
                moderation: '❯ Moderation',
                util: '❯ Utilities',
                testing: '❯ Testing'
            }[category.id];

            if (title) embed.addField(title, `${category.filter(cmd => cmd.aliases.length > 0).map(cmd => `\`${cmd.aliases[0]}\``).join(' ')}`);
        }

        return message.channel.send({ embed });
    }
}

module.exports = HelpCommand;