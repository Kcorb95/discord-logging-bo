const Command = require('../../struct/Command');
const { MessageEmbed } = require('discord.js');
const Members = require(`../../models/Members`);
const Users = require(`../../models/Users`);
const Permissions = require('../../struct/Permissions');

class RoleInfoCommand extends Command {
    constructor() {
        super('name-history', {
            aliases: ['name-history', 'names', 'nicknames', 'usernames', 'alliases'],
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
                    'Displays name history for a provided User.'
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
        return 'NotWhitelisted';
    }

    async exec(message, { user }) {
        const memberData = await Members.findOne({ where: { guildIDUserIDPair: `${message.guild.id}.${user.id}` } });
        const userData = await Users.findOne({ where: { userID: user.id } });

        let nicknameHistory = []; // Define as empty array because it may not exist
        if (memberData !== null) nicknameHistory = memberData.nameHistory; // if it does exist, set it to the actual data
        let usernameHistory = [];
        if (userData !== null) usernameHistory = userData.nameHistory;

        const embeds = []; // multiple embeds possible
        let page = 2; // define up here so both field sections can use it
        let fieldCount = 1;
        let thisEmbed;

        const embed = new MessageEmbed()
            .setAuthor(`❓ |️ Name History for User "${user.username}" | ❓️`, message.guild.iconURL())
            .setColor(`#309eff`)
            .setTimestamp(new Date())
            .setThumbnail(user.displayAvatarURL())
            .setFooter(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.displayAvatarURL());
        thisEmbed = embed;

        if (nicknameHistory.length <= 10) // more than 10 names?
            thisEmbed.addField(`❯ Nicknames (${nicknameHistory.length})`, nicknameHistory.length > 0 ? nicknameHistory.join(' **--** ') : `None!`); // no, just use one field then
        else { // yes
            thisEmbed.addField(`❯ Nicknames (${nicknameHistory.length}) Page 1`, nicknameHistory.length > 0 ? nicknameHistory.slice(0, 10).join(' **--** ') : `None!`); // first 10 names
            for (let i = 10; i < nicknameHistory.length; i += 10) { // go through list of names 10 by 10
                //When we reach our field limit for this embed, create a new one
                if (fieldCount === 22) { // max 22 fields
                    fieldCount = 1; // reset to 1
                    embeds.push(thisEmbed); // push the full embed
                    thisEmbed = new MessageEmbed() // create new one
                        .setAuthor(`❓ |️ Name History for User "${user.username}" | ❓️`, message.guild.iconURL())
                        .setColor(`#309eff`)
                        .setTimestamp(new Date())
                        .setThumbnail(user.displayAvatarURL())
                        .setFooter(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.displayAvatarURL());
                }
                if ((i + 10) > nicknameHistory.length) // is this the end of the array? (less than 10 left)
                    thisEmbed.addField(`❯ Nicknames Page ${page}`, nicknameHistory.slice(i).join(' **--** '));
                else
                    thisEmbed.addField(`❯ Nicknames Page ${page}`, nicknameHistory.slice(i, i + 10).join(' **--** '));
                page++;
                fieldCount++;
            }
        }

        if (usernameHistory.length <= 10) {
            thisEmbed.addField(`❯ Usernames (${usernameHistory.length})`, usernameHistory.length > 0 ? usernameHistory.slice(0, 25).join(' **--** ') : `None!`);
            embeds.push(thisEmbed); // Do not push at end of last builder, otherwise duplicates. This pushes because it's "done" as the final field in embed
        } else {
            // more than 10 names for this last section
            thisEmbed.addField(`❯ Usernames (${usernameHistory.length}) Page 1`, usernameHistory.slice(0, 10).join(' **--** '));
            for (let i = 10; i < usernameHistory.length; i += 10) {
                //When we reach our field limit for this embed, create a new one
                if (fieldCount === 22) {
                    fieldCount = 1;
                    embeds.push(thisEmbed);
                    thisEmbed = new MessageEmbed()
                        .setAuthor(`❓ |️ Name History for User "${user.username}" | ❓️`, message.guild.iconURL())
                        .setColor(`#309eff`)
                        .setTimestamp(new Date())
                        .setThumbnail(user.displayAvatarURL())
                        .setFooter(`${this.client.user.username}#${this.client.user.discriminator}`, this.client.user.displayAvatarURL());
                }
                if ((i + 10) > usernameHistory.length)
                    thisEmbed.addField(`❯ Usernames Page ${page}`, usernameHistory.slice(i).join(' **--** '));
                else
                    thisEmbed.addField(`❯ Usernames Page ${page}`, usernameHistory.slice(i, i + 10).join(' **--** '));
                page++;
                fieldCount++;
            }
            embeds.push(thisEmbed); // push here because no more fields after this
        }

        return embeds.forEach(embed => message.util.send(embed));
    }
}

module.exports = RoleInfoCommand;