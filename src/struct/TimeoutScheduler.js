const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { Op } = require("sequelize");
const moment = require("moment");

const Timeouts = require("../models/Timeouts");
const Logger = require("../util/Logger");

const timers = new Map();

module.exports = class TimeoutScheduler {
  static async sync(guilds) {
    Logger.info("Synchronizing timeouts...", { tag: "TimeoutScheduler" });
    timers.clear();
    // Fetch all entries less than or equal to 5 minutes from NOW
    const mutes = await Timeouts.findAll({ where: { muteEnd: { [Op.lte]: moment().add(5, "minutes").toDate() } } });

    mutes.map(async (mute) => {
      console.log(`queueing untimeout... ${mute.muteEnd.getTime() - new Date().getTime()}`);
      const timer = setTimeout(
        async () => {
          console.log(`destroying mute...`);
          const guild = guilds.resolve(mute.guildID);
          if (!guild) return mute.destroy();
          const member = await guild.members.fetch(mute.userID);
          if (!member) return mute.destroy();
          const channel = await guild.channels.resolve(mute.channelID);
          if (!channel) return mute.destroy();
          channel.permissionOverwrites.map((perm) => {
            if (perm.id === mute.userID)
              perm.update({
                SEND_MESSAGES: null,
                ADD_REACTIONS: null,
              });
          });
          timers.delete(`${mute.userID}.${mute.guildID}.${mute.channelID}`);

          // Log the unmute in caselogs channel (no need to put in DB tbh)
          const caseLogsChannelID = guild.client.settings.get(guild.id, "caseLogChannel", undefined);
          if (!caseLogsChannelID) return mute.destroy();
          const caseLogschannel = await guild.channels.resolve(caseLogsChannelID);
          if (!caseLogschannel) return mute.destroy();
          const webhooks = await caseLogschannel.fetchWebhooks();
          let caseLogHook = webhooks.find((webhook) => webhook.name === "Case Logs");
          if (!caseLogHook)
            caseLogHook = await caseLogschannel.createWebhook("Case Logs", {
              avatar: `https://i.imgur.com/9rIwlja.png`,
              reason: "For messaging without ratelimits. Do not change!",
            });

          const embed = new MessageEmbed()
            .setAuthor(`❗️ | Timeout Removed | ❗️`, guild.iconURL())
            .setFooter(`Member Timeout Removed...`, guild.client.user.displayAvatarURL())
            .setColor(`#9bd6e8`)
            .setDescription(
              stripIndents`
                **User**: ${member} -- ${member.id}
                **Action**: UnTimeout
                **Moderator**: --Automatic--`
            )
            .setTimestamp();
          caseLogHook.send(embed);

          return mute.destroy();
        },
        // If mute has already expired, number will be negative and thus will auto-run
        mute.muteEnd.getTime() - new Date().getTime()
      );
      timers.set(`${mute.userID}.${mute.guildID}.${mute.channelID}`, timer);
    });
  }

  // Remove unmute from scheduler (usefull for manual unmutes and adjusting the remaining time)
  static async unQueue(key) {
    console.log(`Unqueueing UnTimeout...`);
    clearInterval(timers.get(key));
    return timers.delete(key);
  }

  static async scheduleMute(member, duration, channelID, caseID) {
    console.log(`Scheduling Timeout...`);
    const currentDate = moment(new Date());
    const endDate = currentDate.add(duration, "milliseconds");
    const newMute = await Timeouts.create({
      userID: member.id,
      guildID: member.guild.id,
      channelID,
      caseID,
      muteEnd: endDate,
    });
    return newMute;
  }

  static async fetchMute(member, channelID) {
    console.log(`Fetching Mute...`);
    const existingMute = await Timeouts.findOne({ where: { userID: member.id, guildID: member.guild.id, channelID } });
    return existingMute;
  }
};
