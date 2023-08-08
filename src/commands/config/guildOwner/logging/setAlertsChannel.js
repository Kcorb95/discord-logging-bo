const Command = require("../../../../struct/Command");

class SetAlertChannel extends Command {
  constructor() {
    super("set-alert-log-channel", {
      aliases: ["set-alert-log", "set-alert-logs", "set-alerts-log", "set-alerts-logs", "set-alerts", "set-alert"],
      category: "guildOwner",
      channel: "guild",
      args: [
        {
          id: "channel",
          match: "content",
          type: "textChannel",
          prompt: {
            start: "What channel should alert logs be sent to?",
            retry: "That is not a valid channel! Please check help and try again.",
          },
        },
      ],
      description: {
        content: ["Sets the default channel for bot alerts to be posted."],
        usage: "<channel>",
        examples: ["#Sakura-Alerts", "Sakura-Alerts"],
      },
    });
    this.protected = true;
  }

  userPermissions(message) {
    if (message.author.id === this.client.ownerID) return null;
    if (message.author.id !== message.guild.ownerID) return "GuildOwner";
    return null;
  }

  async exec(message, { channel }) {
    this.client.settings.set(message.guild, "botAlertsChannel", channel.id);
    return message.util.reply(`Bot alert logs will now be posted in ${channel}`);
  }
}

module.exports = SetAlertChannel;
