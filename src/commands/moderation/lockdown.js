const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");
const Moderation = require("../../struct/Moderation");

class LockdownCommand extends Command {
  constructor() {
    super("lockdown", {
      aliases: ["lockdown"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "channel",
          type: "channel",
          prompt: {
            start: "What channel do you wish to deny sending messages in?",
            retry: "That... is not a valid channel...? Enter a valid channel...",
            optional: true,
          },
          default: (message) => message.channel,
        },
      ],
      description: {
        content: `Locks a specified channel (or the current one if not specified) so that non-moderators cannot send messages.`,
        usage: "<Channel>",
        examples: ["general", "#general", "123123"],
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

  async exec(message, { channel }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");
    if (!channel.permissionsFor(message.guild.roles.everyone).has(["SEND_MESSAGES"])) {
      channel.updateOverwrite(message.guild.roles.everyone, {
        SEND_MESSAGES: null,
        ADD_REACTIONS: null,
      });
      return await webhook.send(`Ended`).then((msg) => msg.delete({ timeout: 5000 }));
    } else {
      channel.updateOverwrite(message.guild.roles.everyone, {
        SEND_MESSAGES: false,
        ADD_REACTIONS: false,
      });
      return await webhook.send(`Started`).then((msg) => msg.delete({ timeout: 5000 }));
    }
  }
}

module.exports = LockdownCommand;
