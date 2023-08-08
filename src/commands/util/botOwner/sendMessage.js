const Command = require('../../../struct/Command');

class SendMessageCommand extends Command {
    constructor() {
        super('send-message', {
            aliases: ['send-message', 'send'],
            category: 'guildOwner',
            channel: 'guild',
            ownerOnly: true,
            args: [
                {
                    id: 'textChannel',
                    type: 'textChannel',
                    prompt: {
                        start: 'Where should I say this?',
                        retry: 'That is not a valid text channel!'
                    }
                },
                {
                    id: 'messageToSend',
                    type: 'string',
                    match: 'rest',
                    prompt: {
                        start: 'What should I be saying?',
                        retry: 'That is not a valid string!'
                    }
                }
            ],
            description: {
                content: [
                    'Echo a message to a provided text channel'
                ],
                usage: '<textChannel> <messageToSend>',
                examples: ['#general Hello World!']
            }
        });
        this.protected = true;
    }
    
    async exec(message, { messageToSend, textChannel }) {
        textChannel.send(messageToSend);
        return message.util.reply(`sent!`);
    }
}

module.exports = SendMessageCommand;