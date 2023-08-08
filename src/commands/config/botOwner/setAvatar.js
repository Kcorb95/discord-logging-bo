const Command = require('../../../struct/Command');

class SetAvatarCommand extends Command {
    constructor() {
        super('set-avatar', {
            aliases: ['set-avatar', 'change-avatar', 'change-pfp', 'set-pfp'],
            category: 'botOwner',
            channel: 'guild',
            ownerOnly: true,
            cooldown: 600000, // 10 minutes
            ratelimit: 3,
            args: [
                {
                    id: 'imageURL',
                    type: 'url',
                    prompt: {
                        start: 'Enter the URL to use for an avatar...',
                        retry: 'This is not a valid URL...'
                    }
                }
            ],
            description: {
                content: [
                    'Sets the bot\'s current profile picture',
                    'ONLY URLs are supported'
                ],
                usage: '<imageURL>',
                examples: ['https://i.imgur.com/ChHkDy9.jpg']
            }
        });
        this.protected = true;
    }

    exec(message, { imageURL }) {
        message.util.send(`Old PFP: ${this.client.user.avatarURL()}`);
        this.client.user.setAvatar(imageURL.href);

        return message.util.reply(`bot avatar updated!`);
    }
}

module.exports = SetAvatarCommand;