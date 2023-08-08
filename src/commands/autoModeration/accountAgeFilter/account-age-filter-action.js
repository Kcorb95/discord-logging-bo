const Command = require("../../../struct/Command");
const { Argument } = require("discord-akairo");
const Permissions = require("../../../struct/Permissions");
const AccountAgeFilter = require("../../../struct/AccountAgeFilterManager");

class SetAccountAgeFilterAction extends Command {
  constructor() {
    super("set-account-age-filter-action", {
      aliases: ["set-account-age-filter-action", "set-account-age-action", "set-aaf-action", "aaf-action"],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      description: {
        content: "Sets the action to apply when a user is hit by the account age filter. (Kick or Ban them...)",
      },
      args: [
        {
          id: "action",
          type: Argument.validate("string", (m, p, str) => ["KICK", "BAN"].includes(str.toUpperCase())),
          prompt: {
            start: "Select which action to take between kick or ban.",
            retry: (message, { phrase }) => `${phrase} is not a valid option. Please try again.`,
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

  async exec(message, { action }) {
    const thefilter = await AccountAgeFilter.setFilterAction(message.guild.id, action);

    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Wanna discuss the fallback option later.
    // (This shouldn't be necessary as fetchWebhook() already creates an "Asuka" if it's unable to fetch one in the provided channel)
    // Welllll unless it's not able to create one :thonk::::
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

module.exports = SetAccountAgeFilterAction;
