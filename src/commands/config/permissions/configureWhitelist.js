const Command = require('../../../struct/Command');
const Permissions = require('../../../struct/Permissions');

class ConfigureWhitelistCommand extends Command {
    constructor() {
        super('configure-whitelist', {
            aliases: ['configure-whitelist', 'whitelist-configure', 'set-whitelist', 'whitelist-set', 'set-wl', 'wl-set', 'conf-wl', 'wl-conf', 'config-wl', 'wl-config'],
            channel: 'guild',
            category: 'permissions',
            description: { content: 'Set a command to whitelist only (true) or blacklist only (false). Whitelisted commands can ONLY be run by people explicitly defined with the set command.' },
            args: [
                {
                    id: 'commandObject',
                    type: 'command',
                    prompt: {
                        start: 'What is the unique command name you wish to edit the whitelist setting for?',
                        retry: 'That is not a valid command name! Please check help and try again.'
                    }
                },
                {
                    id: 'whitelistSetting',
                    type: ['true', 'false'],
                    prompt: {
                        start: 'Should this command be whitelist only where it will *only* run for the targets specifically enabled (true) or run for everyone *except* for targets specifically disabled? (false)',
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

    async exec(message, { commandObject, whitelistSetting }) {
        whitelistSetting = whitelistSetting === 'true';

        const perms = await Permissions.setWhitelist(commandObject, message.guild, whitelistSetting);
        if (perms === false) message.util.reply(`Error! Command is protected, permissions not changed!`);
        else message.reply(`okay, whitelist has been set to ${whitelistSetting} for command ${commandObject.id}`);
    }
}

module.exports = ConfigureWhitelistCommand;