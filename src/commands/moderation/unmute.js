const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const MuteScheduler = require("../../struct/MuteScheduler");
const Mutes = require("../../models/Mutes");

class UnMuteCommand extends Command {
  constructor() {
    super("unmute", {
      aliases: ["unmute"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "member",
          match: "content",
          type: "nonModMember",
          prompt: {
            start: "What member would you like to unmute?",
            retry: (message, { failure }) => `${failure.value} Try again...`,
          },
        },
      ],
      description: {
        content: `Unmutes a user.`,
        usage: "<Member>",
        examples: ["@User", "@Member", "1234515132412", "eclipse", "eclipse#1995"],
      },
    });
    this.protected = false;
    this.whitelist = true;
  }

  userPermissions(message) {
    if (message.author.id === this.client.ownerID) return null;
    const canBeRun = Permissions.canRun(this, message.guild, message.channel, message.member);
    if (canBeRun === true) return null;
    return "NoPerms";
  }

  async exec(message, { member }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Get the mute role (if it exists)
    const muteRole = this.client.settings.get(message.guild.id, "muteRole", undefined);
    if (!muteRole) return webhook.send(`Error: Mute role not configured! Please fix`);

    // remove mute role from member
    member.roles.remove(muteRole);

    // find mute in the database and destroy it if it exists
    const mutes = await Mutes.findAll({ where: { userID: member.id, guildID: member.guild.id } });
    mutes.map((mute) => mute.destroy());

    // removes mute from the unmute queue
    MuteScheduler.unQueue(`${member.user.id}.${message.guild.id}`);

    // Log the unmute in caselogs channel (no need to put in DB tbh)
    const caseLogsChannelID = this.client.settings.get(message.guild.id, "caseLogChannel", undefined);
    if (!caseLogsChannelID)
      return webhook.send(`**Error:** Please configure the case logs channel for this bot! ${member} has been unmuted...`);
    const caseLogsChannel = await message.guild.channels.resolve(caseLogsChannelID);
    if (!caseLogsChannel)
      return webhook.send(`**Error:** Please configure the case logs channel for this bot! ${member} has been unmuted...`);
    const webhooks = await caseLogsChannel.fetchWebhooks();
    let caseLogHook = webhooks.find((webhook) => webhook.name === "Case Logs");
    if (!caseLogHook)
      caseLogHook = await caseLogsChannel.createWebhook("Case Logs", {
        avatar: this.client.user.avatarURL(),
        reason: "For messaging without ratelimits. Do not change!",
      });

    const embed = new MessageEmbed()
      .setAuthor(`❗️ | Unmuted | ❗️`, message.guild.iconURL())
      .setFooter(`Member Unmuted...`, this.client.user.displayAvatarURL())
      .setColor(`#9bd6e8`)
      .setDescription(
        stripIndents`
                **User**: ${member} -- ${member.id}
                **Action**: Unmute
                **Moderator**: ${message.member}`
      )
      .setTimestamp();
    caseLogHook.send(embed);

    // Inform user of unmute
    member
      .send(
        `You have been unmuted in ${member.guild.name}!\nPlease familiarize yourself with the rules to avoid further infractions.\nIf you have any questions, please reach out to a mod in #support or open a ticket in #tickets :)`
      )
      .catch((e) => {
        webhook.send(`This user has DMs disabled! Please try to contact them through other means.`);
      });
    // success
    return webhook.send(`${member} has been unmuted...`);
  }
}

module.exports = UnMuteCommand;
