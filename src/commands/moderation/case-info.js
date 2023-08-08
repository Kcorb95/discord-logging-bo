const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const { stripIndents } = require("common-tags");
const { ms } = require("@naval-base/ms");

const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const Moderation = require("../../struct/Moderation");
const Cases = require("../../models/Cases");

class CaseInfoCommand extends Command {
  constructor() {
    super("case-information", {
      aliases: ["case-information", "case-info", "case", "view-case"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "caseID",
          type: "integer",
          prompt: {
            start: "What is the Case ID for the case you wish to edit?",
            retry: "That is an invalid Case ID! Please enter a valid Case ID...",
          },
        },
      ],
      description: {
        content: `View detailed info for a case.`,
        usage: "<caseID>",
        examples: ["123"],
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

  async exec(message, { caseID }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    const foundCase = await Cases.findOne({ where: { caseID } });
    if (!foundCase) return webhook.send(`**Error:** Could not find case! Please check that you have the correct caseID...`);
    const member = await message.guild.members.fetch(foundCase.userID);
    const embed = new MessageEmbed()
      .setAuthor(`Case ID ${caseID} for ${member.user.tag} -- ${member.id}`, member.user.avatarURL())
      .setFooter(`Case#${caseID}. Use ASDAS to update reason later...`, message.guild.iconURL())
      .setTimestamp()
      .setColor(Moderation.getColor(foundCase.infractionType)).setDescription(stripIndents`
                **Case ID:** ${foundCase.caseID}
                **Created On:** ${moment.utc(foundCase.createdAt).local().format("l h:mm a")}
                **Member:** ${member} -- ${member.id}
                **Infraction:** ${foundCase.infractionType}
                **Reason:** ${foundCase.reason}
                ${foundCase.dmReason ? `**DM Reason:** ${foundCase.dmReason}` : ``}
                **Moderator:** <@${foundCase.moderatorID}> -- ${foundCase.moderatorID}
                ${foundCase.muteDuration > 0 ? `**Mute Duration:** ${ms(foundCase.muteDuration)}` : ``}
                ${foundCase.timeoutChannelID ? `**Channel:** <#${foundCase.timeoutChannelID}>` : ``}
                ${foundCase.messagePrune > 0 ? `**Prune:** ${foundCase.messagePrune} Days` : ``}
                ${foundCase.screenshot ? `**Screenshot:** ${foundCase.screenshot}` : ``}
                `);
    if (foundCase.screenshot) embed.setImage(foundCase.screenshot);
    return webhook.send(embed);
  }
}

module.exports = CaseInfoCommand;
