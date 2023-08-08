const { ms } = require("@naval-base/ms");
const { Argument } = require("discord-akairo");
const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const InviteManager = require("../../../struct/InviteFilterManager");

class InviteFilterBanPruneCommand extends Command {
  constructor() {
    super("set-invite-filter-ban-prune", {
      aliases: [
        "set-invite-filter-ban-prune",
        "invite-filter-ban-prune",
        "invite-filter-prune",
        "invite-filter-prune-dur",
        "inv-filter-prune-dur",
        "inv-filter-ban-prune",
        "inv-filter-prune",
      ],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "days",
          type: Argument.range("number", 0, 7),
          prompt: {
            start: `How many days back should the banned user's messages be pruned? (0 - 7)`,
            retry: `Please enter a number 0 - 7 for prune in days`,
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

  async exec(message, { days }) {
    const thefilter = await InviteManager.setBanPrune(message.guild.id, parseInt(days));

    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Wanna discuss the fallback option later.
    if (!webhook) {
      message.util.send("I need a webhook, bro.");
    }

    const guild = this.client.guilds.cache.get(message.guild.id);

    const filterembed = await InviteManager.getEmbed(thefilter, this.client, guild);

    return webhook.send({
      content: `Filter ban prune has been set to ${days} Days`,
      embeds: [filterembed],
    });
  }
}

module.exports = InviteFilterBanPruneCommand;
