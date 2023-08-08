const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const AccountAgeFilter = require("../../../struct/AccountAgeFilterManager");

class AccountAgeFilterRemoveWhitelist extends Command {
  constructor() {
    super("account-age-filter-remove-whitelist", {
      aliases: [
        "account-age-filter-remove-whitelist",
        "account-age-filter-remove",
        "account-age-filter-remove-wl",
        "aaf-wl-remove",
        "aaf-remove-wl",
        "account-age-filter-rem-whitelist",
        "account-age-filter-rem",
        "account-age-filter-rem-wl",
        "aaf-wl-rem",
        "aaf-rem-wl",
        "account-age-filter-del-whitelist",
        "account-age-filter-del",
        "account-age-filter-del-wl",
        "aaf-wl-del",
        "aaf-del-wl",
        "rem-wl-aaf",
        "wl-rem-aaf",
      ],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      description: {
        content: "Allow the account age filter to yeet someone's ass again",
      },
      args: [
        {
          id: "userID",
          type: "string",
          prompt: {
            start: "ID of the user to add to the whitelist.",
            retry: "Invalid user",
          },
        },
      ],
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

  async exec(message, { userID }) {
    const thefilter = await AccountAgeFilter.removeFromWhiteList(message.guild.id, userID);

    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Wanna discuss the fallback option later.
    if (!webhook) {
      message.util.send("I need a webhook, bro.");
    }

    const guild = this.client.guilds.cache.get(message.guild.id);

    const filterEmbed = await AccountAgeFilter.getEmbed(thefilter, this.client, guild);

    return webhook.send({
      embeds: [filterEmbed],
    });
  }
}

module.exports = AccountAgeFilterRemoveWhitelist;
