const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const AccountAgeFilter = require("../../../struct/AccountAgeFilterManager");

class ViewAccountAgeFilter extends Command {
  constructor() {
    super("view-account-age-filter", {
      aliases: ["view-account-age-filter", "view-aaf", "vaaf", "aaf", "account-age-filter"],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      description: {
        content: "Shows all relevant filter information",
      },
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

  async exec(message) {
    const thefilter = await AccountAgeFilter.getAccountAgeFilter(message.guild.id);

    if (!thefilter) return "There is no filter setup yet.";

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

module.exports = ViewAccountAgeFilter;
