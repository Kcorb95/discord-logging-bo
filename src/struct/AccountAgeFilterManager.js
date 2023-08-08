const AccountAgeFilter = require("../models/AccountAgeFilter");
const moment = require("moment");
const { MessageEmbed } = require("discord.js");

module.exports = class AccountAgeFilterManager {
  /**
   * Create AccountAgeFilter
   * @param guildID Guild ID,
   * @param enabled enabled boolean (defaults to true)
   * @param accountAgeMin Minimum number of days the account has to be to pass the filter
   * @param whitelistedUsers Users who have been allowed to bypass this cause they are real people
   * @param action Action to take on filter | currently between KICK or BAN
   * @returns AccountAgeFilter Instance
   */

  static async createAccountAgeFilter(guildID, enabled, accountAgeMinDays, whitelistedUserIDs = [], action = "KICK") {
    // Validate filter action (should be uneccessary but eyy)
    if (!["KICK", "BAN"].includes(action.toUpperCase())) return `Invalid action type for this filter...`;

    // Check if a filter already exists
    const accountAgeFilter = await AccountAgeFilter.findOne({ where: { guildID } });

    if (accountAgeFilter) return `Filter already exists for this Guild...`;

    const newFilter = await AccountAgeFilter.create({
      guildID,
      enabled,
      accountAgeMinDays,
      whitelistedUserIDs,
      action: action !== null ? action.toUpperCase() : "KICK",
    });

    return newFilter;
  }

  /**
   * Destroy Filter
   * Primarily for testing but also just good crud management
   * @param guildID Guild ID
   * @returns String
   */

  static async deleteAccountAgeFilter(guildID) {
    const accountAgeFilter = await AccountAgeFilter.findOne({ where: { guildID } });

    if (!accountAgeFilter) return "Filter Destroyed...";
    await accountAgeFilter.destroy();
    return "Filter Destroyed...";
  }

  /**
   * Fetch AccountAgeFilter
   * @param guildID Guild ID
   * @returns AccountAgeFilter Instance
   */

  static async getAccountAgeFilter(guildID) {
    const accountAgeFilter = await AccountAgeFilter.findOne({ where: { guildID } });

    if (!accountAgeFilter) {
      const newFilter = await this.createAccountAgeFilter(guildID, false, 5, [], "KICK");
      return newFilter;
    }

    return accountAgeFilter;
  }

  /**
   * Toggle Enabled on AccountAgeFilter
   * @param guildID Guild id to toggle filter for
   * @param onOFF Whether to force turn on or not
   * @returns AccountAgeFilter Instance
   */
  static async toggleAccountAgeFilter(guildID, onOFF) {
    const accountAgeFilter = await AccountAgeFilter.findOne({ where: { guildID } });

    if (!accountAgeFilter) {
      const newfilter = await this.createAccountAgeFilter(guildID, onOFF, 5, [], "KICK");
      return newfilter;
    }

    if (typeof onOFF !== "boolean") {
      accountAgeFilter.enabled = !accountAgeFilter.enabled;
      await accountAgeFilter.save();
      return accountAgeFilter;
    }

    accountAgeFilter.enabled = onOFF;
    await accountAgeFilter.save();
    return accountAgeFilter;
  }

  /**
   * Set AccountAgeMin
   * @param guildID Guild ID to set minimum age filter days on
   * @param days Integer to set the number of days to
   * @returns AccountAgeFilter Instance
   */

  static async setAccountAgeMin(guildID, days) {
    const accountAgeFilter = await AccountAgeFilter.findOne({ where: { guildID } });

    if (!accountAgeFilter) {
      const newfilter = await this.createAccountAgeFilter(guildID, true, days, [], "KICK");
      return newfilter;
    }

    accountAgeFilter.accountAgeMinDays = parseInt(days);
    await accountAgeFilter.save();
    return accountAgeFilter;
  }

  /**
   * AddToWhitelist
   * Add a person to a whitelist temporarily
   * @param guildID Guild ID for this whitelist
   * @param userID User ID to add to the whitelist
   * @param timestamp Date when this was added to the whitelist
   * @returns AccountAgeFilter Instance
   */

  static async addToWhitelist(guildID, userID) {
    const accountAgeFilter = await AccountAgeFilter.findOne({ where: { guildID } });

    if (!accountAgeFilter) {
      const newfilter = await this.createAccountAgeFilter(guildID, true, 5, [
        {
          userID: userID,
          timestamp: new Date(),
        },
      ]);

      return newfilter;
    }

    // Avoid duplicates
    const exists = accountAgeFilter.whitelistedUserIDs.filter((fusers) => fusers.userID === userID);
    if (exists.length > 0) return accountAgeFilter;

    await accountAgeFilter.update({
      whitelistedUserIDs: [...accountAgeFilter.whitelistedUserIDs, { userID: userID, timestamp: new Date() }],
    });

    return accountAgeFilter;
  }

  /**
   * removeFromWhitelist
   * Remove a person from the whitelist
   * @param guildID Guild ID for the whitelist
   * @param userID User ID to remove from the whitelist
   * @returns AccountAgeInstance
   */

  static async removeFromWhiteList(guildID, userID) {
    const accountAgeFilter = await AccountAgeFilter.findOne({ where: { guildID } });

    if (!accountAgeFilter) {
      const newFilter = await this.createAccountAgeFilter(guildID, true, 5, [], "KICK");
      return newFilter;
    }

    const newFilterWhitelist = accountAgeFilter.whitelistedUserIDs.filter((fusers) => fusers.userID !== userID);

    await accountAgeFilter.update({ whitelistedUserIDs: newFilterWhitelist });

    return accountAgeFilter;
  }

  /**
   * setFilterAction
   * Sets the filter action currently between KICK | BAN
   * @param guildID Guild ID to use
   * @param action Action to setit to between KICK | BAN
   * @returns AccountAgeFilter Instance
   */

  static async setFilterAction(guildID, action) {
    if (!["KICK", "BAN"].includes(action.toUpperCase())) return `Invalid action type for this filter...`;

    const accountAgeFilter = await AccountAgeFilter.findOne({ where: { guildID } });

    if (!accountAgeFilter) {
      const newfilter = await this.createAccountAgeFilter(guildID, true, 5, [], action.toUpperCase());
      return newfilter;
    }

    accountAgeFilter.action = action.toUpperCase();
    await accountAgeFilter.save();
    return accountAgeFilter;
  }

  /**
   * getEmbed
   * returns an embed for the filter
   * @param thefilter Filter being used for the embed
   * @param client Bot client using this
   * @param guild Guild this embed is being sent in
   * @returns Embed object
   */

  static async getEmbed(thefilter, client, guild) {
    const embed = new MessageEmbed()
      .setAuthor(`❓ Account Age Filter Settings For "${guild.name}" ❓️`, guild.iconURL())
      .setColor("#309eff")
      .setTimestamp(new Date())
      .setThumbnail(guild.iconURL())
      .setFooter(`${client.user.username}#${client.user.discriminator}`, client.user.displayAvatarURL())
      .addField("Enabled", thefilter.enabled ? "Yes" : "No", true)
      .addField("Action", thefilter.action, true)
      .addField(
        "Account Age",
        thefilter.accountAgeMinDays > 1
          ? `${thefilter.accountAgeMinDays} days old`
          : `${thefilter.accountAgeMinDays} day old`,
        true
      )
      .addField(
        "Whitelisted Users",
        thefilter.whitelistedUserIDs.length > 0
          ? thefilter.whitelistedUserIDs.map((user) => {
              return `<@${user.userID}> // ${moment.utc(user.timestamp).local().format("MMMM D YYYY, h:mm:ss A")} Added`;
            })
          : "None",
        true
      );

    return embed;
  }
};
