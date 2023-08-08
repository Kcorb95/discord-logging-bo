const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const InviteManager = require("../../../struct/InviteFilterManager");

class InviteFilterToggleCommand extends Command {
  constructor() {
    super("toggle-invite-filter", {
      aliases: [
        "toggle-invite-filter",
        "invite-filter-toggle",
        "inv-filter-toggle",
        "toggle-inv-filter",
        "enable-inv-filter",
        "disable-inv-filter",
        "enable-invite-filter",
        "disable-invite-filter",
      ],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "enabled",
          type: ["true", "false"],
          prompt: {
            start: "Should the filter be enabled or disabled? (True/False)",
            retry: "Please enter True to enable or False to disabled the invite filter.",
          },
        },
      ],
      description: {
        content: ["Enable or Disable automatic invite filtering for this guild."],
        usage: "<boolean>",
        examples: ["true", "false"],
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

  async exec(message, { enabled }) {
    var thefilter;
    if (enabled == "true") thefilter = await InviteManager.enableFilter(message.guild.id);
    else thefilter = await InviteManager.disableFilter(message.guild.id);

    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Wanna discuss the fallback option later.
    if (!webhook) {
      message.util.send("I need a webhook, bro.");
    }

    const guild = this.client.guilds.cache.get(message.guild.id);

    const filterembed = await InviteManager.getEmbed(thefilter, this.client, guild);

    return webhook.send({
      content: `Invite filter enabled has been set to ${enabled}`,
      embeds: [filterembed],
    });
  }
}

module.exports = InviteFilterToggleCommand;
