const Command = require('../../../struct/Command');
const Logger = require('../../../util/Logger');

class ReloadCommand extends Command {
    constructor() {
        super('reload', {
            aliases: ['reload', 'r'],
            category: 'botOwner',
            ownerOnly: true,
            quoted: false,
            description: {
                content: 'Reloads a module or all modules at once.',
                usage: '[type] <module>'
            }
        });
        this.protected = true;
    }

    *args() {
        const type = yield {
            type: [['command', 'c'], ['inhibitor', 'i'], ['listener', 'l']],
            default: 'command'
        };
        const mod = yield {
            type: (msg, phrase) => {
                if (!phrase) return null;
                const resolver = this.handler.resolver.type({
                    command: 'commandAlias',
                    inhibitor: 'inhibitor',
                    listener: 'listener'
                }[type]);
                return resolver(msg, phrase);
            }
        };
        return { type, mod };
    }

    async exec(message, { type, mod }) {
        if (!mod) {
            return message.util.reply(`Invalid ${type} ${type === 'command' ? 'alias' : 'ID'} specified to reload.`);
        }

        try {
            mod.reload();
            return message.util.reply(`Successfully reloaded ${type} \`${mod.id}\`.`);
        } catch (err) {
            Logger.error(`Error occurred reloading ${type} ${mod.id}`);
            return message.util.reply(`Failed to reload ${type} \`${mod.id}\`.`);
        }
    }
}

module.exports = ReloadCommand;