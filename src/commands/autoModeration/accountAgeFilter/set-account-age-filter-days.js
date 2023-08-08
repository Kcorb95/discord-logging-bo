const Command = require("../../../struct/Command");
const Permissions = require("../../../struct/Permissions");
const AccountAgeFilter = require("../../../struct/AccountAgeFilterManager");
const { Argument } = require("discord-akairo");

class SetAccountAgeFilterDays extends Command {
  constructor() {
    super("set-account-age-filter-days", {
      aliases: [
        "set-account-age-filter-days",
        "set-account-age-filter-min-days",
        "set-account-age-filter-min-age",
        "set-aaf-min-days",
        "aaf-min-days",
        "aaf-days",
        "account-age-filter-days",
      ],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "days",
          type: Argument.range("number", 1, 30),
          prompt: {
            start: "How old must the user account be in days to NOT be kicked/banned?",
            retry: "How do you enter a number wrong? Enter the minimum age in days (1 - 30)...",
          },
        },
      ],
      description: {
        content: ["Configure how old a user account must be in days for it to NOT be yeeted"],
        usage: "<number>",
        examples: ["1", "5", "10"],
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

  async exec(message, { days }) {
    const thefilter = await AccountAgeFilter.setAccountAgeMin(message.guild.id, days);

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

module.exports = SetAccountAgeFilterDays;
