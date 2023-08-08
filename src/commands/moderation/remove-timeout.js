const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const TimeoutScheduler = require("../../struct/TimeoutScheduler");
const Timeouts = require("../../models/Timeouts");

class RemoveTimeoutCommand extends Command {
  constructor() {
    super("remove-timeout", {
      aliases: ["remove-timeout"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "member",
          type: "nonModMember",
          prompt: {
            start: "What member do you wish to remove a timeout from?",
            retry: (message, { failure }) => `${failure.value} Try again...`,
          },
        },
        {
          id: "channel",
          type: "channel",
          prompt: {
            start: "What channel do you want to remove their timeout from?",
            retry: "That's like, not a channel man...",
          },
        },
      ],
      description: {
        content: `Free a user from the pits of despair.`,
        usage: "<Member>",
        examples: ["@User", "@Member", "1234515132412", "eclipse", "eclipse#1995"],
      },
    });
    this.protected = false;
    this.whitelist = true;
  }

  userPermissions(message) {
    const canBeRun = Permissions.canRun(this, message.guild, message.channel, message.member);
    if (canBeRun === true) return null;
    return "NoPerms";
  }

  async exec(message, { member, channel }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // find mute in the database and destroy it if it exists
    const mutes = await Timeouts.findAll({ where: { userID: member.id, guildID: member.guild.id, channelID: channel.id } });
    mutes.map((mute) => mute.destroy());

    // removes mute from the unmute queue
    TimeoutScheduler.unQueue(`${member.user.id}.${message.guild.id}.${channel.id}`);

    channel.permissionOverwrites.map((perm) => {
      if (perm.id === member.user.id) perm.delete();
    });

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
      .setAuthor(`❗️ | Timeout Removed | ❗️`, message.guild.iconURL())
      .setFooter(`Member Timeout Removed...`, this.client.user.displayAvatarURL())
      .setColor(`#9bd6e8`)
      .setDescription(
        stripIndents`
                **User**: ${member} -- ${member.id}
                **Channel**: ${channel}
                **Action**: UnTimeout
                **Moderator**: ${message.member}`
      )
      .setTimestamp();
    caseLogHook.send(embed);

    // Inform user of unmute
    member
      .send(
        `Your timeout in ${channel} in ${member.guild.name} has been removed!\nPlease familiarize yourself with the rules to avoid further infractions.\nIf you have any questions, please reach out to a mod in #support or open a ticket in #tickets :)`
      )
      .catch((e) => {
        webhook.send(`This user has DMs disabled! Please try to contact them through other means.`);
      });
    // success
    return webhook.send(`${member} has been freed...`);
  }
}

module.exports = RemoveTimeoutCommand;
