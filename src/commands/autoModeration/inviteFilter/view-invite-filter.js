const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const InviteManager = require("../../../struct/InviteFilterManager");

class InviteFilterViewCommand extends Command {
  constructor() {
    super("invite-filter-view", {
      aliases: [
        "invite-filter-view",
        "view-invite-filter",
        "view-inv-filter",
        "inv-filter-view",
        "view-inv-filter-whitelist",
        "view-whitelist-inv-filter",
        "view-invite-filter-whitelist",
        "view-whitelist-invite-filter",
        "view-inv-filter-wl",
        "view-wl-inv-filter",
        "view-invite-filter-wl",
        "view-wl-invite-filter",
        "inv-filter",
        "invite-filter",
        "inv-filter-whitelist",
        "invite-filter-whitelist",
        "inv-filter-wl",
        "invite-filter-wl",
      ],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      description: {
        content: "Display Invite Filter configuration.",
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
    const thefilter = await InviteManager.getFilter(message.guild.id);

    if (!thefilter) return "There is no filter for that guild.";

    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Wanna discuss the fallback option later.
    if (!webhook) {
      message.util.send("I need a webhook, bro.");
    }

    const guild = this.client.guilds.cache.get(message.guild.id);

    const filterembed = await InviteManager.getEmbed(thefilter, this.client, guild);

    return webhook.send({
      embeds: [filterembed],
    });
  }
}

module.exports = InviteFilterViewCommand;
