const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const AccountAgeFilter = require("../../../struct/AccountAgeFilterManager");

class ToggleAccountAgeFilter extends Command {
  constructor() {
    super("toggle-account-age-filter", {
      aliases: ["toggle-account-age-filter", "taaf"],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "enabled",
          type: ["true", "false"],
          prompt: {
            start: "Should the account age filter be enabled or disabled?",
            retry: "Please enter True to enable or False to disable the account age filter.",
          },
        },
      ],
      description: {
        content: ["Enable or Disable automatic account filtering based on user account age for this guild."],
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
    let thefilter;
    if (enabled === "true") thefilter = await AccountAgeFilter.toggleAccountAgeFilter(message.guild.id, true);
    else thefilter = await AccountAgeFilter.toggleAccountAgeFilter(message.guild.id, false);

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

module.exports = ToggleAccountAgeFilter;
