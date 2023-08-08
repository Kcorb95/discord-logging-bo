const Command = require("../../struct/Command");
const Permissions = require("../../struct/Permissions");

class SlowmodeCommand extends Command {
  constructor() {
    super("slowmode", {
      aliases: ["slowmode"],
      category: "moderation",
      channel: "guild",
      ownerOnly: false,
      args: [
        {
          id: "rate",
          type: "integer",
          prompt: {
            start: "Users should be able to send one messager every what amount of seconds?",
            end: "Enter a valid number smooth brain...",
          },
          unordred: true,
        },
        {
          id: "channel",
          type: "channel",
          prompt: {
            start: "What channel do you wish to configure the slowmode of?",
            retry: "That... is not a valid channel...? Enter a valid channel...",
            optional: true,
          },
          unordered: true,
          default: (message) => message.channel,
        },
      ],
      description: {
        content: `Sets the slowmode for a given channel (or the current channel if none specified).`,
        usage: "<Channel> 5",
        examples: ["general 5", "#general 2", "123123 8", "5"],
      },
    });
    this.protected = false;
    this.whitelist = true;
  }

  userPermissions(message) {
    const canBeRun = Permissions.canRun(this, message.guild, message.channel, message.member);
    if (canBeRun === true) return null;
    return "NoPerms";
  }

  async exec(message, { channel, rate }) {
    // Use webhook to avoid getting ratelimited
    const webhook = await this.client.messageUtils.fetchWebhook(message.channel, "Asuka");

    channel.setRateLimitPerUser(rate);

    return await webhook.send(`🏃‍♂️🏃‍♂️`).then((msg) => msg.delete({ timeout: 5000 }));
  }
}

module.exports = SlowmodeCommand;
