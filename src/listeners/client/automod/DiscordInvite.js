const { Listener } = require("discord-akairo");
const { ms } = require("@naval-base/ms");
const InviteManager = require("../../../struct/InviteFilterManager");
const Moderation = require("../../../struct/Moderation");
const MuteScheduler = require("../../../struct/MuteScheduler");

class DiscordInviteListener extends Listener {
  constructor() {
    super("discordInvite", {
      event: "message",
      emitter: "client",
      category: "automod",
    });
  }

  async exec(message) {
    // Is it a DM?
    if (!message.guild) return null;
    if (message.author.bot) return null;
    // Setup our regex.
    // Checks for any (letter or number or special char) after the .gg
    const invitereg = /discord.gg\/\S+/;

    // If does not contain an invite, nothing to do.
    if (!invitereg.test(message.content)) return null;

    // Get a list of whitelisted servers from our Filter Instance
    const filter = await InviteManager.getFilter(message.guild.id);

    // IF filter doesn't exist just move on.
    if (!filter) return null;

    // As well if the filter is off move on.
    if (filter.filterEnabled === false) return null;

    // Otherwise we kick ass and take names.

    // Assign the message invite to a fetch to retrieve the id of the invitation guild.
    const newInvite = await this.client.fetchInvite(message.content);

    // If invite to current guild, obvs don't punish
    if (newInvite.guild.id === message.guild.id) return null;

    // Assign our fetched whitelist to a var.
    const whitelist = filter.whitelist;

    // If the ID of the invitation is in our whitelist, we move on.
    if (whitelist.includes(newInvite.guild.id)) return null;

    // Otherwise we delete the message
    await message.delete();

    const duration = filter.muteDurationMins * 60000; // Minutes to MS
    const pruneDays = parseInt(filter.pruneDurationDays);
    const dmReason = "Do not post Discord Invites!!";

    /**
     * If Action is Mute...
     */
    if (filter.action === "MUTE") {
      const muteRoleID = this.client.settings.get(message.guild.id, "muteRole", undefined);
      if (!muteRoleID) return null;
      const muteRole = await message.guild.roles.resolve(muteRoleID);
      if (!muteRole) return null;

      const mutecase = await Moderation.createCase(
        message.member,
        message.guild,
        "Mute",
        "AUTO: Discord Invite Filter...",
        dmReason,
        null,
        duration,
        null,
        0,
        await message.guild.members.fetch(this.client.user.id)
      );

      if (mutecase === "NO_CHANNEL") return null;

      await MuteScheduler.scheduleMute(message.member, duration, mutecase.caseID);

      message.member.roles.add(muteRole);
      await message.author
        .send(
          `You have been muted in ${message.guild.name} for **${ms(
            duration
          )}**!\nReason: ${dmReason}\nYou may open a ticket in #tickets if you wish to appeal this temporary mute. Arguing will result in longer mutes, kicks or bans.\nPlease refer to the rules/info to avoid further infractions.`
        )
        .catch(console.error);

      /**
       * If Action is kick...
       */
    } else if (filter.action === "KICK") {
      // Post the kick case
      const kickCase = await Moderation.createCase(
        message.member,
        message.guild,
        "Kick",
        "AUTO: Discord Invite Filter...",
        dmReason,
        null,
        0,
        null,
        0,
        await message.guild.members.fetch(this.client.user.id)
      );

      // Inform user of the fucky wucky
      await message.author
        .send(
          `You have been kicked from ${message.guild.name}!\nReason: ${dmReason}\nIf you return, please familiarize yourself with the rules to avoid further infractions. Further infractions after a kick may result in a ban...\nIf you have any questions, please reach out to a mod in #support or open a ticket in #tickets :)`
        )
        .catch(console.error);

      // Show them the door
      await message.member.kick("AUTO: Invite Filtering").catch(console.error);

      /**
       * If Action is Ban...
       */
    } else if (filter.action == "BAN") {
      // Post the ban case
      const banCase = await Moderation.createCase(
        message.member,
        message.guild,
        "Ban",
        "AUTO: Discord Invite Filter...",
        dmReason,
        null,
        0,
        null,
        pruneDays,
        await message.guild.members.fetch(this.client.user.id)
      );

      // Inform user of the fucky wucky
      await message.author
        .send(
          `You have been banned from ${message.guild.name}!\nReason: ${dmReason}\nYou may appeal this ban by filling out our ban appeal form https://goo.gl/forms/g4hF0SnVcT8rBqFw2\nhttps://discord.gg/tR9yB86`
        )
        .catch(console.error);

      // Show them the door
      await message.member.ban({ reason: "AUTO: Invite Filtering", days: pruneDays }).catch(console.error);
    }
  }
}

module.exports = DiscordInviteListener;
