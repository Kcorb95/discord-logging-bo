const Command = require("../../../struct/Command");

const Permissions = require("../../../struct/Permissions");
const AccountAgeFilter = require("../../../struct/AccountAgeFilterManager");

class AccountAgeFilterAddWhitelist extends Command {
  constructor() {
    super("account-age-filter-add-whitelist", {
      aliases: [
        "account-age-filter-add-whitelist",
        "account-age-filter-add",
        "account-age-filter-add-wl",
        "aaf-wl-add",
        "aaf-add-wl",
        "wl-add-aaf",
      ],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      description: {
        content: "Permit a user to join despite being too young so the account age filter doesn't yeet their ass",
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
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");
    if (message.guild.members.resolve(userID)) return webhook.send(`I mean they are already in the guild tho...`);

    const thefilter = await AccountAgeFilter.addToWhitelist(message.guild.id, userID);

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

module.exports = AccountAgeFilterAddWhitelist;
