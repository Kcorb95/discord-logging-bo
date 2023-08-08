const Command = require("../../struct/Command");
const { MessageEmbed } = require("discord.js");
const moment = require(`moment`);
const Permissions = require("../../struct/Permissions");
const Usernames = require("../../models/Usernames");
const Nicknames = require("../../models/Nicknames");

class UserInfoCommand extends Command {
  constructor() {
    super("user-info", {
      aliases: ["user-info", "user", "member-info", "member", "info"],
      category: "information",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "user",
          match: "content",
          type: "user",
          prompt: {
            start: "What User do you want information on?",
            retry: "That is not a valid User! Please check help and try again.",
          },
        },
      ],
      description: {
        content: ["Displays detailed information on a provided User."],
        usage: "<User>",
        examples: ["@User", "@Member", "1234515132412"],
      },
    });
    this.protected = false;
    this.whitelist = false;
  }

  userPermissions(message) {
    const canBeRun = Permissions.canRun(this, message.guild, message.channel, message.member);
    if (canBeRun === true) return null;
    return "NoPerms";
  }

  async exec(message, { user }) {
    const member = message.guild.members.resolve(user) || null; // I think this works? Should be null if not resolved..
    const usernames = await Usernames.findAll({ where: { userID: user.id }, attributes: ["username"], raw: true });
    const nicknames = await Nicknames.findAll({
      where: { userID: user.id, guildID: message.guild.id },
      attributes: ["nickname"],
      raw: true,
    });

    const embed = new MessageEmbed()
      .setAuthor(`❓ |️ Details for User "${user.username}" | ❓️`, message.guild.iconURL())
      .setColor(`#309eff`)
      .setTimestamp(new Date())
      .setThumbnail(user.displayAvatarURL())
      .setFooter(`${this.client.user.tag}`, this.client.user.displayAvatarURL())
      .addField(`❯ Name`, `${user} **::** ${user.tag}`)
      .addField(`❯ ID`, user.id, true)
      .addField(`❯ Account Created`, `${moment.utc(user.createdAt).local().format("LLLL")}`);
    if (member) embed.addField(`❯ Member Joined`, `${moment.utc(member.joinedAt).local().format("LLLL")}`);
    if (usernames.length > 0) embed.addField(`❯ Username History`, `${usernames.map((e) => e.username).join(` **--** `)}`);
    if (nicknames.length > 0) embed.addField(`❯ Nickname History`, `${nicknames.map((e) => e.nickname).join(` **--** `)}`);

    return message.util.send(embed);
  }
}

module.exports = UserInfoCommand;
