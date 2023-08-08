const InviteFilters = require("../models/InviteFilters");
const { MessageEmbed } = require("discord.js");

module.exports = class InviteFilterManager {
  /**
   * Create Invite Filter
   * @param guildID Guild ID
   * @param enabled boolean (defaults to false)
   * @param whitelist array of ids to whitelist
   * @param action string option between mute, kick, ban
   * @returns InviteFilter Instance
   */

  static async createInviteFilter(guildID, enabled = null, whitelist = [], action = null) {
    if (!guildID) return `Invalid GuildID ${guildID}`;

    if (!["MUTE", "KICK", "BAN"].includes(action.toUpperCase())) return `Invalid Action, ${action}...`;

    // Check if a filter already exists
    const checkFilter = await InviteFilters.findOne({ where: { guildID } });

    if (checkFilter) return `Filter already exists for this Guild...`;

    // Create a new Invite Filter Instance
    const newInviteFilter = await InviteFilters.create({
      guildID: guildID,
      enabled: enabled,
      whitelist: whitelist,
      action: action !== null ? action.trim().toUpperCase() : "MUTE",
    });

    return newInviteFilter;
  }

  /**
   * getFilter
   * Returns the InviteFilterInstance
   *
   * @param guildID Guild ID
   * @returns InviteFilterInstance
   */

  static async getFilter(guildID) {
    const thefilter = await InviteFilters.findOne({
      where: { guildID: guildID },
    });

    if (!thefilter) {
      const newfilter = await this.createInviteFilter(guildID, true, [], "MUTE");

      return newfilter;
    }
    return thefilter;
  }

  /**
   * Delete Filter
   * Deletes the Filter from the database
   *
   * @param guildID Guild ID
   * @returns string
   *
   */

  static async deleteInviteFilter(guildID) {
    const thefilter = await InviteFilters.findOne({
      where: { guildID: guildID },
    });
    if (!thefilter) return "Invite Filter successfully disabled...";
    await thefilter.destroy();
    return "Invite Filter successfully disabled...";
  }

  /* Methods */

  /**
   * Enable Filter
   *
   * @param guildID guild ID
   * @returns InviteFilter Instance
   */

  static async enableFilter(guildID) {
    const thefilter = await InviteFilters.findOne({
      where: { guildID: guildID },
    });

    if (!thefilter) {
      const newfilter = await this.createInviteFilter(guildID, true, [], "MUTE");
      return newfilter;
    }

    thefilter.enabled = true;
    await thefilter.save();
    return thefilter;
  }

  /**
   * Disable Filter
   *
   * @param GuildID guild ID
   * @returns InviteFilter Instance
   */
  static async disableFilter(guildID) {
    const thefilter = await InviteFilters.findOne({
      where: { guildID: guildID },
    });

    if (!thefilter) {
      const newfilter = await this.createInviteFilter(guildID, false, [], "MUTE");
      return newfilter;
    }

    thefilter.enabled = false;
    await thefilter.save();
    return thefilter;
  }

  /**
   * Toggle Filter
   *
   * @param guildID guild ID - taken from the message
   * @returns InviteFilter Instance
   */

  static async toggleFilter(guildID) {
    const thefilter = await InviteFilters.findOne({ where: { guildID } });

    if (!thefilter) {
      const newfilter = await this.createInviteFilter(guildID, true, [], "MUTE");
      return newfilter;
    }

    thefilter.enabled = !thefilter.enabled;
    await thefilter.save();
    return thefilter;
  }

  /**
   * Add to Whitelist
   * Adds a whitelisted id to the message guild
   * @param guildID Guild ID - Taken from the message
   * @param newid Guild ID
   * @returns InviteFilter Instance
   */

  static async addToList(guildID, newid) {
    const thefilter = await InviteFilters.findOne({
      where: { guildID: guildID },
    });

    // Just return the filter instance as to not short circuit our promises.

    if (!thefilter) {
      const newfilter = await this.createInviteFilter(guildID, true, [newid], "MUTE");
      return newfilter;
    }

    if (thefilter.whitelist === null) {
      thefilter.whitelist = [newid];
      await thefilter.save();
      return thefilter;
    } else {
      if (thefilter.whitelist.find((item) => item === newid)) return thefilter;
      else await thefilter.update({ whitelist: [...thefilter.whitelist, newid] });
      return thefilter;
    }
  }

  /**
   * Delete From Whitelist
   * @param guildID guild ID
   * @param oldId guild id to be removed
   * @retuns InviteFilter Instance
   */

  static async removeFromList(guildID, oldId) {
    const thefilter = await InviteFilters.findOne({
      where: { guildID: guildID },
    });
    if (!thefilter) {
      const newfilter = await this.createInviteFilter(guildID, true, [], "MUTE");
      return newfilter;
    }

    const desfilter = thefilter.whitelist.find((item) => item === oldId);

    if (!desfilter) return thefilter;

    const newwhitelist = thefilter.whitelist.filter((item) => item !== oldId);

    await thefilter.update({ whitelist: newwhitelist });

    return thefilter;
  }

  /* Set Action */

  /**
   * Set Filter Action
   * @param guildID Guild ID
   * @param action  action to do (mute,kick,ban)
   * @returns InviteFilter Instance
   */

  static async setFilterAction(guildID, action) {
    const invFilter = await InviteFilters.findOne({
      where: { guildID: guildID },
    });

    if (!["MUTE", "KICK", "BAN"].includes(action.toUpperCase())) {
      return `${action} is not a valid option`;
    }

    if (!invFilter) {
      const newFilter = await this.createInviteFilter(guildID, true, [], action);
      return newFilter;
    }

    invFilter.action = action.toUpperCase();
    await invFilter.save();
    return invFilter;
  }

  /* Set Mute Duration */

  /**
   * Set Mute Duration
   * @param guildID Guild ID
   * @param muteDurationMS the mute duration in ms
   * @returns InviteFilter Instance
   */

  static async setMuteDuration(guildID, muteDurationMinutes) {
    const invFilter = await InviteFilters.findOne({
      where: { guildID: guildID },
    });

    if (!invFilter) {
      const newFilter = await this.createInviteFilter(guildID, true, [], action);
      newFilter.muteDurationMins = parseInt(muteDurationMinutes); // Set the new parameter
      newFilter.action = "MUTE"; // Switch types because inferring
      await newFilter.save();
      return newFilter;
    }

    invFilter.muteDurationMins = parseInt(muteDurationMinutes);
    invFilter.action = "MUTE"; // Switch types because inferring
    await invFilter.save();
    return invFilter;
  }

  /* Set Ban Prune */

  /**
   * Set Ban Prune
   * @param guildID Guild ID
   * @param pruneDays how many days to prune on ban
   * @returns InviteFilter Instance
   */

  static async setBanPrune(guildID, pruneDays) {
    const invFilter = await InviteFilters.findOne({
      where: { guildID: guildID },
    });

    if (!invFilter) {
      const newFilter = await this.createInviteFilter(guildID, true, [], action);
      newFilter.pruneDurationDays = parseInt(pruneDays); // Set the new parameter
      newFilter.action = "BAN"; // Switch types because inferring
      await newFilter.save();
      return newFilter;
    }

    invFilter.pruneDurationDays = parseInt(pruneDays);
    invFilter.action = "BAN"; // Switch types because inferring
    await invFilter.save();
    return invFilter;
  }

  /**
   * Get Embed
   * Used to fetch the embed and edit it all in one place rather than repeated embeds across the commands
   * @params filter InviteFilter Instance
   * @params client Bot Client using this
   * @params guild Guild this embed is being sent in
   * @returns Embed Object
   */

  static async getEmbed(filter, client, guild) {
    const embed = new MessageEmbed()
      .setAuthor(`❓ Invite Filter Settings For "${guild.name}" ❓️`, guild.iconURL())
      .setColor("#309eff")
      .setTimestamp(new Date())
      .setThumbnail(guild.iconURL())
      .setFooter(`${client.user.username}#${client.user.discriminator}`, client.user.displayAvatarURL())
      .addField("Enabled", filter.enabled ? "Yes" : "No", true)
      .addField("Action", `${filter.action}`, true);
    if (filter.action === "MUTE") embed.addField("Mute Duration", `${filter.muteDurationMins} Minutes`, true);
    if (filter.action === "BAN") embed.addField("Prune", `${filter.pruneDurationDays} Days`, true);
    embed.addField(
      "Whitlisted Server IDs",
      filter.whitelist !== (null || undefined) && filter.whitelist.length > 0
        ? filter.whitelist.map((id) => `${id}`)
        : "None.",
      false
    );

    return embed;
  }
};
