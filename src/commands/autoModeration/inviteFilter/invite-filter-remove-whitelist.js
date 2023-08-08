const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const InviteManager = require("../../../struct/InviteFilterManager");

class InviteFilterRemoveFromWhitelistCommand extends Command {
  constructor() {
    super("invite-filter-remove-from-whitelist", {
      aliases: [
        "invite-filter-remove-from-whitelist",
        "remove-from-whitelist-invite-filter",
        "remove-whitelist-invite-filter",
        "invite-filter-remove-whitelist",
        "invite-filter-rem-whitelist",
        "invite-filter-whitelist-remove",
        "whitelist-remove-invite-filter",
        "wl-remove-inv-filter",
        "wl-remove-invite-filter",
        "wl-rem-inv-filter",
        "wl-rem-invite-filter",
        "wl-dek-inv-filter",
        "wl-del-invite-filter",
        "inv-filter-wl-remove",
        "inv-filter-wl-rem",
        "inv-filter-remove-wl",
        "inv-filter-rem-wl",
        "invite-filter-remove-wl",
        "invite-filter-rem-wl",
        "invite-filter-wl-remove",
        "invite-filter-wl-rem",
      ],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "guildID",
          type: "string",
          prompt: {
            start:
              "Please enter the Guild ID for a server that you would like to remove from the invite filter whitelist...",
          },
        },
      ],
      description: {
        content: ["Stop allowing invites for a given Guild ID from be posted without being filtered."],
        usage: "<guild id>",
        examples: ["12345"],
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

  async exec(message, { guildID }) {
    const removeFromList = await InviteManager.removeFromList(message.guild.id, guildID);

    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Wanna discuss the fallback option later.
    if (!webhook) {
      message.util.send("I need a webhook, bro.");
    }

    const guild = this.client.guilds.cache.get(message.guild.id);

    const filterembed = await InviteManager.getEmbed(removeFromList, this.client, guild);

    return webhook.send({
      content: `${guildID} removed from the whitelist.`,
      embeds: [filterembed],
    });
  }
}

module.exports = InviteFilterRemoveFromWhitelistCommand;
