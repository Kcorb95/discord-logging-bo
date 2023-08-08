const { Argument } = require('discord-akairo');
const Permissions = require('../../../struct/Permissions');
const Command = require('../../../struct/Command');

class SetPermissionCommand extends Command {
    constructor() {
        super('set-permission', {
            aliases: ['set-permission', 'permission-set', 'configure-permission', 'permission-configure', 'perm-config', 'config-perm', 'set-perm', 'set-perms', 'perms-set', 'perm-set', 'conf-perm', 'perm-conf', 'add-perm', 'perm-add', 'add-permission', 'permission-add'],
            channel: 'guild',
            category: 'permissions',
            description: { content: 'Defines a permission for a given command and permission target (Text Channel, Guild Member, Guild Role). Valid settings are enabled, can run (true) *and* disabled, cannot run (false)' },
            args: [
                {
                    id: 'commandObject',
                    type: 'command',
                    prompt: {
                        start: 'What is the unique command name you wish to edit permissions for?',
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
                },
                {
                    id: 'permSetting',
                    type: ['true', 'false'],
                    prompt: {
                        start: 'Should running this command be enabled (true) or disabled (false) for the given type?',
                        retry: 'That is not a valid setting! Please enter True or False.'
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

    async exec(message, { commandObject, permType, permSetting }) {
        permSetting = permSetting === 'true';
        const perms = await Permissions.setPermission(commandObject, message.guild, permType.type ? 'CHANNEL' : permType.members ? 'ROLE' : 'MEMBER', permType.id, permSetting);
        if (perms === false) message.util.reply(`Error! Command is protected, permissions not changed!`);
        else message.reply(`okay, **${commandObject.id}** has been set **${permSetting}** for: ${permType}`);
    }
}

module.exports = SetPermissionCommand;