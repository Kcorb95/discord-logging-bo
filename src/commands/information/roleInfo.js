const Command = require('../../struct/Command');
const { MessageEmbed } = require('discord.js');
const moment = require(`moment`);
const Permissions = require('../../struct/Permissions');

class RoleInfoCommand extends Command {
    constructor() {
        super('role-info', {
            aliases: ['role-info', 'role'],
            category: 'information',
            channel: 'guild',
            ownerOnly: false,
            args: [
                {
                    id: 'role',
                    match: 'content',
                    type: 'role',
                    prompt: {
                        start: 'What role do you want information on?',
                        retry: 'That is not a valid role! Please check help and try again.'
                    }
                }
            ],
            description: {
                content: [
                    'Displays detailed information on a provided role.'
                ],
                usage: '<role>',
                examples: ['@Admin', '1234515132412']
            }
        });
        this.protected = false;
        this.whitelist = false;
    }

    userPermissions(message) {
        const canBeRun = Permissions.canRun(this, message.guild, message.channel, message.member);
        if (canBeRun === true) return null;
        return 'NotWhitelisted';
    }

    async exec(message, { role }) {
        const members = role.members.map(member => `${member}`);
        //const members = await new Promise(_members);
        const embeds = [];
        const embed = new MessageEmbed()
            .setAuthor(`❓ |️ Details for Role "${role.name}" | ❓️`, role.guild.iconURL())
            .setColor(`#309eff`)
            .setTimestamp(new Date())
            .setThumbnail(role.guild.iconURL())
            .setFooter(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.displayAvatarURL())
            .addField(`❯ Name`, `${role} :: ${role.name}`, true)
            .addField(`❯ ID`, role.id, true)
            .addField(`❯ Sidebar?`, role.hoist, true)
            .addField(`❯ Pingable?`, role.mentionable, true)
            .addField(`❯ HexColor`, role.hexColor, true)
            .addField(`❯ Created`, moment.utc(role.createdAt).local().format('LLLL'));
        if (members.length <= 10) {
            embed.addField(`❯ Members (${members.length})`, members.join(` **--** `));
            embeds.push(embed);
        } else {
            let page = 2;
            let fieldCount = 7;
            let thisEmbed = embed;
            thisEmbed.addField(`❯ Members (${members.length}) Page 1`, members.slice(0, 10).join(' **--** '));
            for (let i = 10; i < members.length; i += 10) {
                //When we reach our field limit for this embed, create a new one
                if (fieldCount === 25) {
                    fieldCount = 1;
                    embeds.push(thisEmbed);
                    thisEmbed = new MessageEmbed()
                        .setAuthor(`❓ |️ ${role.name} Details | ❓️`, role.guild.iconURL())
                        .setColor(`#309eff`)
                        .setTimestamp(new Date())
                        .setThumbnail(role.guild.iconURL())
                        .setFooter(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.displayAvatarURL())
                }
                if ((i + 10) > members.length)
                    thisEmbed.addField(`❯ Members Page ${page}`, members.slice(i).join(' **--** '));
                else
                    thisEmbed.addField(`❯ Members Page ${page}`, members.slice(i, i + 10).join(' **--** '));
                page++;
                fieldCount++;
            }
            embeds.push(thisEmbed);
        }

        return embeds.forEach(embed => message.util.send(embed));
    }
}

module.exports = RoleInfoCommand;