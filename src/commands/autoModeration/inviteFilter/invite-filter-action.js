const Command = require("../../../struct/Command");
const { Argument } = require("discord-akairo");
const Permissions = require("../../../struct/Permissions");
const InviteManager = require("../../../struct/InviteFilterManager");

class SetInviteFilterActionCommand extends Command {
  constructor() {
    super("set-invite-filter-action", {
      aliases: ["set-invite-filter-action", "invite-filter-action", "inv-filter-action"],
      category: "automod",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "action",
          // Update to check if answer is one of our three and kill/complain if not.
          type: Argument.validate("string", (m, p, str) => ["MUTE", "KICK", "BAN"].includes(str.toUpperCase())),
          prompt: {
            start: "Please enter MUTE, KICK or BAN for the action...",
            retry: (message, { phrase }) =>
              `${phrase} is not a valid option.\nPlease enter MUTE, KICK or BAN for the action...`,
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
    const thefilter = await InviteManager.setFilterAction(message.guild.id, action.toUpperCase());

    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    // Wanna discuss the fallback option later.
    if (!webhook) {
      message.util.send("I need a webhook, bro.");
    }

    const guild = this.client.guilds.cache.get(message.guild.id);

    const filterembed = await InviteManager.getEmbed(thefilter, this.client, guild);

    return webhook.send({
      content: `Filter action has been set to ${action.toUpperCase()}`,
      embeds: [filterembed],
    });
  }
}

module.exports = SetInviteFilterActionCommand;
