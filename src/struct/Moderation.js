const { stripIndents, oneLine } = require("common-tags");
const moment = require("moment");
const { ms } = require("@naval-base/ms");

const { MessageEmbed } = require("discord.js");
const Cases = require("../models/Cases");

module.exports = class Moderation {
  static async createCase(
    user,
    guild,
    infractionType,
    reason,
    dmReason,
    screenshot,
    muteDuration,
    timeoutChannelID,
    prune,
    moderator
  ) {
    const caseLogsChannelID = user.client.settings.get(guild.id, "caseLogChannel", undefined);
    if (!caseLogsChannelID) return "NO_CHANNEL";
    const caseLogsChannel = await guild.channels.resolve(caseLogsChannelID);
    if (!caseLogsChannel) return "NO_CHANNEL";
    const webhooks = await caseLogsChannel.fetchWebhooks();
    let webhook = webhooks.find((webhook) => webhook.name === "Case Logs");
    if (!webhook)
      webhook = await caseLogsChannel.createWebhook("Case Logs", {
        avatar: `https://i.imgur.com/9rIwlja.png`,
        reason: "For messaging without ratelimits. Do not change!",
      });

    const newCase = await Cases.create({
      userID: user.id,
      guildID: guild.id,
      infractionType,
      reason,
      dmReason,
      screenshot,
      moderatorID: moderator.id,
      muteDuration,
      timeoutChannelID,
      messagePrune: prune,
    });

    const embed = new MessageEmbed()
      .setAuthor(this.formatHeader(infractionType), guild.iconURL())
      .setColor(this.getColor(infractionType))
      .setDescription(
        this.formatDescription(user, infractionType, reason, dmReason, muteDuration, timeoutChannelID, prune, moderator)
      );
    if (screenshot) {
      embed.setImage(screenshot);
      embed.setURL(screenshot);
    }
    embed.setFooter(
      `Case #${newCase.caseID}. Use ${user.client.settings.get(guild.id, "prefix", "/")}reason ${
        newCase.caseID
      } to update reason later...`,
      user.client.user.displayAvatarURL()
    );
    embed.setTimestamp();

    const caseMessage = await webhook.send({
      embeds: [embed],
    });
    // update message ID
    newCase.caseMessageID = caseMessage.id;
    await newCase.save();

    return newCase;
  }

  static async fetchCaseHistory(guild, member) {
    // This can highkey be fixed with a cache
    const infractions = await Cases.findAll({ where: { userID: member.id, guildID: guild.id } });
    const sorted = {
      Notes: [],
      Warns: [],
      Strikes: [],
      Mutes: [],
      Timeouts: [],
      Kicks: [],
      Bans: [],
      Softbans: [],
    };
    await infractions.map((infraction) => sorted[`${infraction.dataValues.infractionType}s`].push(infraction.dataValues));

    // Send summary as plain text message, then
    // build embeds using generic loop for ONLY stuff that has stuff
    // return array with summary at index 0 and then the rest is the additional embeds

    const messages = [];
    messages.push(
      `Case History for ${member}(${member.id})...\n**${sorted.Notes.length}** Notes, **${sorted.Warns.length}** Warnings, **${sorted.Strikes.length}** Strikes, **${sorted.Mutes.length}** Mutes, **${sorted.Timeouts.length}** Timeouts, **${sorted.Kicks.length}** Kicks, **${sorted.Bans.length}** Bans and **${sorted.Softbans.length}** Softbans...`
    );

    for (let type in sorted) {
      if (sorted[type].length > 0) {
        // See if we have any cases of this TYPE on user
        const casesEmbed = new MessageEmbed() // Create the cases embed for this TYPE
          .setAuthor(`${type} (${sorted[type].length}) for ${member.user.tag}`, member.user.displayAvatarURL())
          .setFooter(`${type} (${sorted[type].length}) for ${member.user.tag}`, guild.iconURL())
          .setColor(this.getColor(type.substring(0, type.length - 1)));

        // Here we fuckin go....
        let activeField = { name: `${type} (${sorted[type].length})`, value: "" };
        let fields = [];
        sorted[type].map((TYPE) => {
          let entry = "";
          switch (TYPE.infractionType) {
            case "Note":
              entry = `**ID:** ${TYPE.caseID} | **Reason:** ${TYPE.reason} | **By:** <@${TYPE.moderatorID}> on ${moment
                .utc(TYPE.createdAt)
                .local()
                .format("l h:mm a")}`;
              break;
            case "Mute":
              entry = `**ID:** ${TYPE.caseID} | **Reason:** ${TYPE.reason} | **DM:** ${TYPE.dmReason} | **Dur:** ${ms(
                TYPE.muteDuration
              )} | **By:** <@${TYPE.moderatorID}> on ${moment.utc(TYPE.createdAt).local().format("l h:mm a")}`;
              break;
            case "Timeout":
              entry = `**ID:** ${TYPE.caseID} | **Reason:** ${TYPE.reason} | **DM:** ${TYPE.dmReason} | **Channel:** <#${
                TYPE.timeoutChannelID
              }> | **Dur:** ${ms(TYPE.muteDuration)} | **By:** <@${TYPE.moderatorID}> on ${moment
                .utc(TYPE.createdAt)
                .local()
                .format("l h:mm a")}`;
              break;
            default:
              entry = `**ID:** ${TYPE.caseID} | **Reason:** ${TYPE.reason} | **DM:** ${TYPE.dmReason} | **By:** <@${
                TYPE.moderatorID
              }> on ${moment.utc(TYPE.createdAt).local().format("l h:mm a")}`;
              break;
          }

          if (activeField.value.length + entry.length > 1000) {
            //MAKE NEW FIELD
            fields.push(activeField);
            activeField = {
              name: `(${fields.length + 1})`,
              value: "",
            };
          }
          // ADD TO EXISTING FIELD
          activeField.value = activeField.value.concat("\n\n", entry);
        });

        fields.push(activeField);
        casesEmbed.addFields(fields);
        messages.push(casesEmbed);
      }
    }
    return messages;
  }

  static formatHeader(infractionType) {
    switch (infractionType) {
      case "Note":
        return `❗️ | New Note Created | ❗️`;
      case "Warn":
        return `❗️ | New Warning Created | ❗️`;
      case "Strike":
        return `❗️ | New Strike Created | ❗️`;
      case "Softban":
        return `❗️ | New Softban Created | ❗️`;
      case "Kick":
        return `❗️ | New Kick Created | ❗️`;
      case "Ban":
        return `❗️ | New Ban Created | ❗️`;
      case "Mute":
        return `❗️ | New Mute Created | ❗️`;
      case "Timeout":
        return `❗️ | New Timeout Created | ❗️`;
    }
  }

  static getColor(infractionType) {
    switch (infractionType) {
      case "Note":
        return "#e3d58d";
      case "Warn":
        return "#E0DB2B";
      case "Strike":
        return "#4E259F";
      case "Mute":
        return "#2BDBE0";
      case "Timeout":
        return "#6a93b0";
      case "Kick":
        return "#E1690B";
      case "Softban":
        return "#5B730F";
      case "Ban":
        return "#7E1616";
      default:
        return "#F1F0EB";
    }
  }

  static formatDescription(user, infractionType, reason, dmReason, muteDuration, timeoutChannelID, prune, moderator) {
    switch (infractionType) {
      case "Note":
        return stripIndents`
                    **User**: ${user} (${user.id})
                    **Action**: Note
                    **Reason**: ${reason}
                    **Moderator**: ${moderator} -- ${moderator.id}
                    `;
      case "Mute":
        return stripIndents`
                    **User**: ${user} (${user.id})
                    **Action**: Mute
                    **Duration**: ${ms(muteDuration, true)}
                    **Reason**: ${reason}
                    **DM Message**: ${dmReason}
                    **Moderator**: ${moderator} -- ${moderator.id}
                    `;

      case "Timeout":
        return stripIndents`
                    **User**: ${user} (${user.id})
                    **Action**: Mute
                    **Duration**: ${ms(muteDuration, true)}
                    **Channel**: <#${timeoutChannelID}>
                    **Reason**: ${reason}
                    **DM Message**: ${dmReason}
                    **Moderator**: ${moderator} -- ${moderator.id}
                    `;
      case "Ban":
        return stripIndents`
                    **User**: ${user} (${user.id})
                    **Action**: Ban
                    **Reason**: ${reason}
                    **DM Message**: ${dmReason}
                    **Prune:** ${prune} Days
                    **Moderator**: ${moderator} -- ${moderator.id}
                    `;
      default:
        return stripIndents`
                    **User**: ${user} (${user.id})
                    **Action**: ${infractionType}
                    **Reason**: ${reason}
                    **DM Message**: ${dmReason}
                    **Moderator**: ${moderator} -- ${moderator.id}
                    `;
    }
  }

  static async editReason(caseID, reason, guild) {
    const foundCase = await Cases.findOne({ where: { caseID } });
    if (!foundCase) return "NO_CASE";

    const caseLogsChannelID = guild.client.settings.get(guild.id, "caseLogChannel", undefined);
    if (!caseLogsChannelID) return "NO_CHANNEL";
    const caseLogsChannel = await guild.channels.resolve(caseLogsChannelID);
    if (!caseLogsChannel) return "NO_CHANNEL";
    const webhooks = await caseLogsChannel.fetchWebhooks();
    let webhook = webhooks.find((webhook) => webhook.name === "Case Logs");
    if (!webhook)
      webhook = await caseLogsChannel.createWebhook("Case Logs", {
        avatar: caseLogsChannel.client.user.avatarURL(),
        reason: "For messaging without ratelimits. Do not change!",
      });

    const message = await caseLogsChannel.messages.fetch(foundCase.caseMessageID);
    if (!message) return; // post as new case message and update ID etc.
    const embed = message.embeds[0];
    embed.setDescription(
      this.formatDescription(
        await guild.members.fetch(foundCase.userID),
        foundCase.infractionType,
        reason,
        foundCase.dmReason,
        foundCase.muteDuration,
        foundCase.timeoutChannelID,
        foundCase.messagePrune,
        await guild.members.fetch(foundCase.moderatorID)
      )
    );
    message.delete();
    const newMessage = await webhook.send(embed);
    foundCase.caseMessageID = newMessage.id;
    foundCase.reason = reason;
    await foundCase.save();
  }

  static async editMuteDuration(caseID, duration, guild) {
    const foundCase = await Cases.findOne({ where: { caseID } });
    if (!foundCase) return "NO_CASE";

    const caseLogsChannelID = guild.client.settings.get(guild.id, "caseLogChannel", undefined);
    if (!caseLogsChannelID) return "NO_CHANNEL";
    const caseLogsChannel = await guild.channels.resolve(caseLogsChannelID);
    if (!caseLogsChannel) return "NO_CHANNEL";
    const webhooks = await caseLogsChannel.fetchWebhooks();
    let webhook = webhooks.find((webhook) => webhook.name === "Case Logs");
    if (!webhook)
      webhook = await caseLogsChannel.createWebhook("Case Logs", {
        avatar: caseLogsChannel.client.user.avatarURL(),
        reason: "For messaging without ratelimits. Do not change!",
      });

    const message = await caseLogsChannel.messages.fetch(foundCase.caseMessageID);
    if (!message) return; // post as new case message and update ID etc.
    const embed = message.embeds[0];
    embed.setDescription(
      this.formatDescription(
        await guild.members.fetch(foundCase.userID),
        foundCase.infractionType,
        foundCase.reason,
        foundCase.dmReason,
        duration,
        foundCase.timeoutChannelID,
        foundCase.prune,
        await guild.members.fetch(foundCase.moderatorID)
      )
    );
    message.delete();
    const newMessage = await webhook.send(embed);
    foundCase.caseMessageID = newMessage.id;
    foundCase.muteDuration = duration;
    await foundCase.save();
  }
};
