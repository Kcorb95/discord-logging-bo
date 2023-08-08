const Command = require('../../../struct/Command');

class SetActivityCommand extends Command {
    constructor() {
        super('set-activity', {
            aliases: ['set-activity'],
            category: 'botOwner',
            channel: 'guild',
            ownerOnly: true,
            cooldown: 600000, // 10 minutes
            ratelimit: 5,
            args: [
                {
                    id: 'type',
                    type: ['playing', 'streaming', 'listening', 'watching'],
                    prompt: {
                        start: 'Please enter `playing`, `streaming`, `listening` or `watching` for activity type...',
                        retry: 'That is not a valid activity type! Please enter `playing`, `streaming`, `listening` or `watching` for activity type...'
                    }
                },
                {
                    id: 'string',
                    type: 'string',
                    prompt: {
                        start: 'Enter the text to be displayed in this activity...',
                        retry: 'That is not a valid activity string...'
                    }
                },
                {
                    id: 'url',
                    type: 'url',
                    prompt: {
                        start: 'Enter the twitch URL for this activity...',
                        retry: 'This is not a valid URL...',
                        optional: true
                    }
                }
            ],
            description: {
                content: [
                    'Sets the bot\'s current activity',
                    'Can include a playing status'
                ],
                usage: '<activityType> <status> <optionalURL>',
                examples: ['"playing" "with cats"', '"streaming" "mining diamonds" "https://www.twitch.tv/theantisocialsociety"']
            }
        });
        this.protected = true;
    }

    exec(message, { type, string, url }) {
        if (url) this.client.user.setActivity(string, { type: "STREAMING", url: url });
        else this.client.user.setActivity(string, { type: type.toUpperCase() });

        return message.util.reply(`bot activity updated!`);
    }
}

module.exports = SetActivityCommand;