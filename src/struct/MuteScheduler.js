const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { Op } = require("sequelize");
const moment = require("moment");

const Mutes = require("../models/Mutes");
const Logger = require("../util/Logger");

const timers = new Map();

module.exports = class MuteScheduler {
  static async sync(guilds) {
    Logger.info("Synchronizing mutes...", { tag: "MuteScheduler" });
    timers.clear();
    // Fetch all entries less than or equal to 5 minutes from NOW
    const mutes = await Mutes.findAll({ where: { muteEnd: { [Op.lte]: moment().add(5, "minutes").toDate() } } });

    mutes.map(async (mute) => {
      console.log(`queueing umute... ${mute.muteEnd.getTime() - new Date().getTime()}`);
      const timer = setTimeout(
        async () => {
          console.log(`destroying mute...`);
          const guild = guilds.resolve(mute.guildID);
          if (!guild) return mute.destroy();
          const member = await guild.members.fetch(mute.userID).catch((e) => mute.destroy());
          if (!member) return mute.destroy();
          const muteRoleID = await guild.client.settings.get(guild.id, "muteRole", undefined);
          if (!muteRoleID) return mute.destroy();
          console.log(muteRoleID);
          const muteRole = await guild.roles.resolve(muteRoleID);
          await member.roles.remove(muteRole).catch((e) => {
            Logger.error;
            return mute.destroy();
          });
          timers.delete(`${mute.userID}.${mute.guildID}`);

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
            .setAuthor(`❗️ | Unmuted | ❗️`, guild.iconURL())
            .setFooter(`Member Unmuted...`, guild.client.user.displayAvatarURL())
            .setColor(`#9bd6e8`)
            .setDescription(
              stripIndents`
                **User**: ${member} -- ${member.id}
                **Action**: Unmute
                **Moderator**: --Automatic--`
            )
            .setTimestamp();
          caseLogHook.send(embed);

          return mute.destroy();
        },
        // If mute has already expired, number will be negative and thus will auto-run
        mute.muteEnd.getTime() - new Date().getTime()
      );
      timers.set(`${mute.userID}.${mute.guildID}`, timer);
    });
  }

  // Remove unmute from scheduler (usefull for manual unmutes and adjusting the remaining time)
  static async unQueue(key) {
    console.log(`Unqueueing unmute...`);
    clearInterval(timers.get(key));
    return timers.delete(key);
  }

  static async scheduleMute(member, duration, caseID) {
    console.log(`Scheduling Mute...`);
    const currentDate = moment(new Date());
    const endDate = currentDate.add(duration, "milliseconds");
    const newMute = await Mutes.create({
      userID: member.id,
      guildID: member.guild.id,
      caseID,
      muteEnd: endDate,
    });
    return newMute;
  }

  static async fetchMute(member) {
    console.log(`Fetching Mute...`);
    const existingMute = await Mutes.findOne({ where: { userID: member.id, guildID: member.guild.id } });
    return existingMute;
  }
};
