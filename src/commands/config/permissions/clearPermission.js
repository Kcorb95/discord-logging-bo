const { Argument } = require('discord-akairo');
const Permissions = require('../../../struct/Permissions');
const Command = require('../../../struct/Command');

class ClearPermissionCommand extends Command {
    constructor() {
        super('clear-permission', {
            aliases: ['clear-permission', 'permission-clear', 'perm-clear', 'clear-perm', 'clear-perms', 'perms-clear', 'clear-setting', 'setting-clear', 'remove-permission', 'permission-remove', 'remove-perm', 'perm-remove', 'rem-perm', 'perm-rem'],
            channel: 'guild',
            category: 'permissions',
            description: { content: 'Clear the permission setting for a given command and target.' },
            args: [
                {
                    id: 'commandObject',
                    type: 'command',
                    prompt: {
                        start: 'What is the unique command name you wish to clear a permission for?',
                        retry: 'That is not a valid command name! Please check help and try again.'
                    }
                },
                {
                    id: 'permType',
                    type: Argument.union('textChannel', 'role', 'member'),
                    prompt: {
                        start: 'Please tag the text channel, role or member target for this command.',
                        retry: 'That is not a valid permission target! Please try again.'
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

    async exec(message, { commandObject, permType }) {
        const perms = await Permissions.clearPermission(commandObject, message.guild, permType.type ? 'CHANNEL' : permType.members ? 'ROLE' : 'MEMBER', permType.id);
        if (perms === false) message.util.reply(`Error! Command is protected, permissions not changed!`);
        else message.reply(`okay, permissions for ${permType} have been cleared in command: ${commandObject.id}`);
    }
}

module.exports = ClearPermissionCommand;