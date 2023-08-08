const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const InviteManager = require("../../../struct/InviteFilterManager");

class InviteFilterAddToWhitelistCommand extends Command {
  constructor() {
    super("invite-filter-add-to-whitelist", {
      aliases: [
        "invite-filter-add-to-whitelist",
        "add-to-whitelist-invite-filter",
        "add-whitelist-invite-filter",
        "invite-filter-add-whitelist",
        "invite-filter-whitelist-add",
        "whitelist-add-invite-filter",
        "wl-add-inv-filter",
        "wl-add-invite-filter",
        "inv-filter-wl-add",
        "inv-filter-add-wl",
        "invite-filter-add-wl",
        "invite-filter-wl-add",
      ],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "guildID",
          type: "string",
          prompt: {
            start: "Please enter the Guild ID for a server that you would like to allow through the invite filter...",
          },
        },
      ],
      description: {
        content: ["Allows invites to a given Guild ID to be posted without being filtered."],
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
    const thefilter = await InviteManager.addToList(message.guild.id, guildID);

    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Wanna discuss the fallback option later.
    if (!webhook) {
      message.util.send("I need a webhook, bro.");
    }

    const guild = this.client.guilds.cache.get(message.guild.id);

    const filterembed = await InviteManager.getEmbed(thefilter, this.client, guild);

    return webhook.send({
      content: `${guildID} added to the whitelist.`,
      embeds: [filterembed],
    });
  }
}

module.exports = InviteFilterAddToWhitelistCommand;
