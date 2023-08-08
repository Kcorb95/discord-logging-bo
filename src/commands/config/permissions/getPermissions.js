const Command = require('../../../struct/Command');
const Permissions = require('../../../struct/Permissions');

class GetPermissionsCommand extends Command {
    constructor() {
        super('get-permissions', {
            aliases: ['get-permissions', 'get-perms', 'see-permissions', 'see-perms', 'view-permissions', 'view-perms', 'show-perms', 'fetch-permissions', 'fetch-perms', 'perms', 'permissions'],
            channel: 'guild',
            category: 'permissions',
            description: { content: 'View a command\'s current guild permission configuration.' },
            args: [
                {
                    id: 'commandObject',
                    type: 'command',
                    prompt: {
                        start: 'What is the unique command name you wish to view the permissions for?',
                        retry: 'That is not a valid command name! Please check help and try again.'
                    }
                }
            ]
        });
        this.protected = true;
    }

    userPermissions(message) {
        if (message.author.id === this.client.ownerID) return null;
        if (message.author.id !== message.guild.ownerID) return 'GuildOwner';
        return null;
    }

    async exec(message, { commandObject }) {
        const perms = await Permissions.getCommandPermissions(commandObject, message.guild);
        message.reply(`\`\`\`js\n${JSON.stringify(perms, null, 2)}\`\`\``);
    }
}

module.exports = GetPermissionsCommand;