const Command = require('../../../../struct/Command');
const GlobalSettings = require('../../../../models/GlobalSettings');

class SetDashboardCommandErrorLogChannel extends Command {
    constructor() {
        super('set-dashboard-command-error-log-channel', {
            aliases: ['set-dashboard-command-error-log-channel', 'dash-error', 'dash-errors', 'dash-error-chan', 'dash-error-channel', 'dash-errors-channel', 'dash-errors-chan'],
            category: 'botOwner',
            channel: 'guild',
            ownerOnly: true,
            args: [
                {
                    id: 'channel',
                    match: 'content',
                    type: 'textChannel',
                    prompt: {
                        start: 'What channel should command error logs be sent to?',
                        retry: 'That is not a valid channel! Please check help and try again.'
                    }
                }
            ],
            description: {
                content: [
                    'Sets the default channel for command error logging.'
                ],
                usage: '<channel>',
                examples: ['#error-logs', 'error-logs']
            }
        });
        this.protected = true;
    }

    async exec(message, { channel }) {
        let settings = await GlobalSettings.findOne({ where: { id: 0 } });
        if (!settings) settings = await GlobalSettings.create({ id: 0 });
        settings.dashboardErrorLogs = channel.id;
        await settings.save();
        return message.util.reply(`message logs will now be sent to ${channel}`);
    }
}

module.exports = SetDashboardCommandErrorLogChannel;