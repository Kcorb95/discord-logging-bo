const Command = require('../../../struct/Command');

class SetStatusCommand extends Command {
    constructor() {
        super('set-status', {
            aliases: ['set-status'],
            category: 'botOwner',
            channel: 'guild',
            ownerOnly: true,
            cooldown: 600000, // 10 minutes
            ratelimit: 5,
            args: [
                {
                    id: 'status',
                    type: ['online', 'idle', 'invisible', 'dnd'],
                    prompt: {
                        start: 'Please enter `online`, `idle`, `invisible` or `dnd` for status...',
                        retry: 'That is not a valid status! Please enter `online`, `idle`, `invisible` or `dnd` for status...'
                    }
                }
            ],
            description: {
                content: [
                    'Sets the bot\'s current status',
                    '`online`, `idle`, `invisible` or `dnd`'
                ],
                usage: '<status>',
                examples: ['online', 'dnd', 'idle', 'invisible']
            }
        });
        this.protected = true;
    }

    exec(message, { status }) {
        this.client.user.setStatus(status);

        return message.util.reply(`bot status updated!`);
    }
}

module.exports = SetStatusCommand;