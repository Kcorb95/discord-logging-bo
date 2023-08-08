const { Listener } = require("discord-akairo");
const Logger = require("../../../util/Logger");
const moment = require("moment");
const AccountAgeFilter = require("../../../struct/AccountAgeFilterManager");
const Moderation = require("../../../struct/Moderation");
const { checkWhiteList, removeFromWhiteList } = require("../../../struct/AccountAgeFilterManager");
const { MessageEmbed } = require("discord.js");

class AccountAgeListener extends Listener {
  constructor() {
    super("accountAge", {
      event: "guildMemberAdd",
      emitter: "client",
      category: "automod",
    });
  }

  async exec(member) {
    // Don't perform if member is bot
    if (member.user.bot) return;

    // Get our filter
    const thefilter = await AccountAgeFilter.getAccountAgeFilter(member.guild.id);

    // If there's no filter, don't try this.
    if (!thefilter) return;

    // If the filter is off don't do anything.
    if (thefilter.enabled === false) return;

    // We use - here because the diff will be negative otherwise
    const userAccountAge = -moment(member.user.createdAt).diff(moment(), "days");

    if (userAccountAge < thefilter.accountAgeMinDays) {
      const botAlertsChannelID = await member.guild.client.settings.get(member.guild.id, "botAlertsChannel", undefined);
      let botAlertsChannel;
      if (botAlertsChannelID) botAlertsChannel = await member.guild.channels.resolve(botAlertsChannelID);

      // Check if user is in the whitelist
      // If they are, do nothing.
      if (thefilter.whitelistedUserIDs.find((user) => user.userID == member.id)) {
        await AccountAgeFilter.removeFromWhiteList(member.guild.id, member.id);
        return;
      }

      const dmreason = "バカ野郎 your account is too young!";

      if (thefilter.action === "KICK") {
        const kickCase = await Moderation.createCase(
          member,
          member.guild,
          "Kick",
          "AUTO: Account age too young...",
          dmreason,
          null,
          0,
          null,
          0,
          member.guild.me
        );

        await member.user
          .send(
            `You have been kicked from ${member.guild.name}!\nReason: ${dmreason}\nTry returning in a few days after your account old enough.`
          )
          .catch((e) => {
            console.log("No dms? Feels bad...");
          });

        await member.kick("Account age too young.").catch(async (e) => {
          botAlertsChannel.send("Error: I do not have kick permissions! Fix me dummy");
        });

        const embed = new MessageEmbed()
          .setAuthor(`⚠️ Account Age Filter Tripped ⚠️`, member.guild.iconURL())
          .setColor("#309eff")
          .setTimestamp(new Date())
          .setThumbnail(member.guild.iconURL())
          .setFooter(
            `${member.client.user.username}#${member.client.user.discriminator}`,
            member.client.user.displayAvatarURL()
          )
          .addField("Member", member, true)
          .addField("Action", "Kicked", true)
          .addField("Account Age", `${userAccountAge} days`, true);
        botAlertsChannel.send(embed);
        return;
      }

      if (thefilter.action === "BAN") {
        const banCase = await Moderation.createCase(
          member,
          member.guild,
          "Ban",
          "AUTO: Account age too young...",
          dmreason,
          null,
          0,
          null,
          0,
          member.guild.me
        );

        await member.user
          .send(
            `You have been banned from ${member.guild.name}!\nReason: ${dmreason}\nYou may appeal this ban by filling out our ban appeal form https://goo.gl/forms/g4hF0SnVcT8rBqFw2\nhttps://discord.gg/tR9yB86`
          )
          .catch((e) => {
            console.log("No dms? Feels bad...");
          });

        await member.ban({ reason: "Account age too young.", days: 1 }).catch((e) => {
          botAlertsChannel.send("Error: I do not have kick permissions! Fix me dummy");
        });
        const embed = new MessageEmbed()
          .setAuthor(`⚠️ Account Age Filter Tripped ⚠️`, member.guild.iconURL())
          .setColor("#309eff")
          .setTimestamp(new Date())
          .setThumbnail(member.guild.iconURL())
          .setFooter(
            `${member.client.user.username}#${member.client.user.discriminator}`,
            member.client.user.displayAvatarURL()
          )
          .addField("Member", member, true)
          .addField("Action", "Banned", true)
          .addField("Account Age", `${userAccountAge} days`, true);
        botAlertsChannel.send(embed);
        return;
      }
    }
  }
}

module.exports = AccountAgeListener;
