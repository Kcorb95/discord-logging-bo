/* eslint-disable multiline-ternary */
const { Listener } = require('discord-akairo');
const Logger = require('../../util/Logger');
const GlobalSettings = require(`../../models/GlobalSettings`);
const Raven = require('raven');
const { MessageEmbed } = require('discord.js');

class ErrorListener extends Listener {
    constructor() {
        super('error', {
            event: 'error',
            emitter: 'commandHandler',
            category: 'commandHandler'
        });
    }

    async exec(error, message, command) {
        const tag = message.guild ? `${message.guild.name}/${message.author.tag}` : `${message.author.tag}`;
        Logger.error(`[${message.content}] ${error}`, { tag });

        Raven.captureBreadcrumb({
            message: 'command_errored',
            category: command ? command.category.id : 'inhibitor',
            data: {
                user: {
                    id: message.author.id,
                    username: message.author.tag
                },
                guild: message.guild ? {
                    id: message.guild.id,
                    name: message.guild.name
                } : null,
                command: command ? {
                    id: command.id,
                    aliases: command.aliases,
                    category: command.category.id
                } : null,
                message: {
                    id: message.id,
                    content: message.content
                }
            }
        });
        Raven.captureException(error);

        if (message.guild ? message.channel.permissionsFor(this.client.user).has('SEND_MESSAGES') : true) {
            const commandReply = await message.channel.send(`Oops! There was a problem running this command. My human overlords have been informed of this error. Please try again later!`);
            commandReply.delete({ timeout: 6000 });
        }

        let settings = await GlobalSettings.findOne({ where: { id: 0 } });
        if (settings && settings.dashboardErrorLogs) {
            const logChannel = this.client.channels.get(settings.dashboardErrorLogs);
            if (logChannel) {
                const embed = new MessageEmbed()
                    .setTitle(`🚨 | Error in command: ${command.id}! | 🚨`)
                    .setColor(`#f542a7`)
                    .setTimestamp(new Date())
                    .setFooter(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.displayAvatarURL())
                    .setThumbnail(logChannel.guild.iconURL())
                    .addField(`❯ Guild`, `${message.guild.name} (${message.guild.id})`)
                    .addField(`❯ Channel`, `${message.channel.name} (${message.channel.id})`)
                    .addField(`❯ Member`, `${message.author} :: ${message.author.username}#${message.author.discriminator} (${message.author.id})`)
                    .addField(`❯ Message`, ['```', message.content, '```'])
                    .addField(`❯ Link`, `[Jump To](${message.url})`)
                    .addField(`❯ Command`, `${command.id} (${command.categoryID})`)
                    .addField(`❯ Path`, command.filepath)
                    .addField(`❯ Message`, `[Jump To](${message.url})`)
                    .addField(`❯ Error`, ['```js', error, '```']);
                logChannel.send(embed);
            }
        }


    }
}

module.exports = ErrorListener;