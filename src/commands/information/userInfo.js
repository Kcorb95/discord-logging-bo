const Command = require('../../struct/Command');
const { MessageEmbed } = require('discord.js');
const moment = require(`moment`);
const Permissions = require('../../struct/Permissions');

class UserInfoCommand extends Command {
    constructor() {
        super('user-info', {
            aliases: ['user-info', 'user', 'member-info', 'member', 'info'],
            category: 'information',
            channel: 'guild',
            ownerOnly: false,
            args: [
                {
                    id: 'user',
                    match: 'content',
                    type: 'user',
                    prompt: {
                        start: 'What User do you want information on?',
                        retry: 'That is not a valid User! Please check help and try again.'
                    }
                }
            ],
            description: {
                content: [
                    'Displays detailed information on a provided User.'
                ],
                usage: '<User>',
                examples: ['@User', '@Member', '1234515132412']
            }
        });
        this.protected = false;
        this.whitelist = false;
    }

    userPermissions(message) {
        const canBeRun = Permissions.canRun(this, message.guild, message.channel, message.member);
        if (canBeRun === true) return null;
        return 'NoPerms';
    }

    async exec(message, { user }) {
        let member = null;
        if (message.guild.members.has(user)) member = await message.guild.members.fetch(user);

        const embed = new MessageEmbed()
            .setAuthor(`❓ |️ Details for User "${user.username}" | ❓️`, message.guild.iconURL())
            .setColor(`#309eff`)
            .setTimestamp(new Date())
            .setThumbnail(user.displayAvatarURL())
            .setFooter(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.displayAvatarURL())
            .addField(`❯ Name`, `${user} :: ${member === null ? user.username : member.displayName}#${user.discriminator}`)
            .addField(`❯ ID`, user.id, true)
            .addField(`❯ Account Created`, `${moment.utc(user.createdAt).local().format('LLLL')}`);
        if (member !== null) embed.addField(`❯ Member Joined`, `${moment.utc(member.joinedAt).local().format('LLLL')}`);


        return message.util.send(embed);
    }
}

module.exports = UserInfoCommand;