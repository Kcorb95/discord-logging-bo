const { Listener } = require('discord-akairo');
const Logger = require('../../util/Logger');

class MissingPermissionsListener extends Listener {
    constructor() {
        super('missingPermissions', {
            event: 'missingPermissions',
            emitter: 'commandHandler',
            category: 'commandHandler'
        });
    }

    exec(message, command, type, missing) {
        const text = {
            client: () => {
                const str = this.missingClientPermissions(message.channel, this.client.user, missing);
                return `I'm missing permissions, ${str} to use that command.`;
            },
            user: () => {
                const str = this.missingUserPermissions(message.author, missing);
                console.log(str);
                return `you do not have permission to use this command: ${str === undefined ? 'moderator permission' : str}`;
            }
        }[type];

        const tag = message.guild ? `${message.guild.name} :: ${message.author.tag} (${message.author.id})` : `${message.author.tag} (${message.author.id})`;
        Logger.log(`=> ${command.id} ~ ${type}Permissions`, { tag });

        if (!text) return;
        if (message.guild && message.channel.permissionsFor(this.client.user).has('SEND_MESSAGES')) message.reply(text());
    }

    missingClientPermissions(channel, user, permissions) {
        const missingPerms = channel.permissionsFor(user).missing(permissions)
            .map(str => {
                if (str === 'VIEW_CHANNEL') return '`Read Messages`';
                if (str === 'SEND_MESSAGES') return '`Send Messages`';
                if (str === 'ATTACH_FILES') return '`Attach Files`';
                if (str === 'USE_VAD') return '`Use VAD`';
                return `\`${str.replace(/_/g, ' ').toLowerCase().replace(/\b(\w)/g, char => char.toUpperCase())}\``;
            });
        return missingPerms.length > 1
            ? `${missingPerms.slice(0, -1).join(', ')} and ${missingPerms.slice(-1)[0]}`
            : missingPerms[0];
    }

    missingUserPermissions(user, permissions) {
        const missingPerms = {
            "GuildOwner": '`Guild Owner Only`',
            "NoPerms": '`Access Denied`'
        };
        return missingPerms[permissions] || undefined;
    }
}

module.exports = MissingPermissionsListener;